class Api::V1::PaymentsController < ApplicationController
  before_action :authenticate_request
  before_action :authorize_admin!, only: [:index_all, :record, :bulk_prompt, :bulk_stk_push]

  # GET /api/v1/payments
  def index
    payments = current_user.payments.includes(:invoice).recent
    payments = payments.where(status: params[:status]) if params[:status].present?
    render json: { success: true, data: { payments: payments.map { |p| payment_json(p) } } }
  end

  # POST /api/v1/payments — Client records a manual payment or initiates M-Pesa/Airtel/Card
  def create
    invoice = current_user.invoices.find_by(id: params[:invoice_id])
    return render json: { success: false, message: "Invoice not found" }, status: :not_found unless invoice

    method = params[:payment_method] || "mpesa"
    amount = (params[:amount] || invoice.total_amount).to_f

    case method
    when "mpesa"
      initiate_mpesa_stk(invoice, amount, current_user)
    when "airtel_money"
      initiate_airtel(invoice, amount, current_user)
    when "card", "bank_card"
      initiate_card_payment(invoice, amount, current_user)
    else
      # Cash / cheque / bank_transfer — record immediately
      record_payment_directly(invoice, amount, method, params[:transaction_reference])
    end
  rescue => e
    render json: { success: false, message: e.message }, status: :unprocessable_entity
  end

  # POST /api/v1/payments/mpesa_callback — Safaricom Daraja STK callback (no auth)
  def mpesa_callback
    result = MpesaService.parse_callback(params.to_unsafe_h)

    if result[:success]
      pending = PendingPayment.find_by(checkout_request_id: result[:checkout_request_id])
      if pending
        payment = Payment.record_payment(
          user:    pending.user,
          invoice: pending.invoice,
          amount:  result[:amount] || pending.amount,
          method:  "mpesa",
          reference: result[:mpesa_receipt_number]
        )
        pending.update!(status: "completed", payment_id: payment.id)

        # Notify client via WebSocket
        ActionCable.server.broadcast(
          "meter_readings:user_#{pending.user_id}",
          { event: "payment_confirmed", payment: { id: payment.id, amount: payment.amount,
            reference: payment.transaction_reference, method: "M-Pesa" } }
        )
      end
    else
      PendingPayment.where(checkout_request_id: result[:checkout_request_id])
                    .update_all(status: "failed")
    end

    render json: { ResultCode: 0, ResultDesc: "Accepted" }
  end

  # POST /api/v1/payments/airtel_callback — Airtel Money callback (no auth)
  def airtel_callback
    result = AirtelMoneyService.parse_callback(params.to_unsafe_h)

    if result[:success]
      pending = PendingPayment.find_by(checkout_request_id: result[:transaction_id])
      if pending
        payment = Payment.record_payment(
          user:    pending.user,
          invoice: pending.invoice,
          amount:  result[:amount] || pending.amount,
          method:  "airtel_money",
          reference: result[:transaction_id]
        )
        pending.update!(status: "completed", payment_id: payment.id)
      end
    end

    render json: { status: "received" }
  end

  # POST /api/v1/payments/flutterwave_callback — Flutterwave webhook (no auth, verify secret)
  def flutterwave_callback
    # Verify Flutterwave webhook signature
    secret_hash = ENV["FLW_SECRET_HASH"]
    if secret_hash.present?
      signature = request.headers["verif-hash"]
      return render json: { status: "rejected" }, status: :unauthorized unless signature == secret_hash
    end

    result = FlutterwaveService.parse_webhook(params.to_unsafe_h)

    if result[:success]
      meta    = result[:meta] || {}
      invoice = Invoice.find_by(id: meta["invoice_id"])
      user    = User.find_by(id: meta["user_id"])

      if invoice && user
        Payment.record_payment(
          user:    user,
          invoice: invoice,
          amount:  result[:amount],
          method:  "bank_card",
          reference: result[:transaction_id]
        )
      end
    end

    render json: { status: "received" }
  end

  # POST /api/v1/payments/flutterwave_verify — Client verifies card payment after redirect
  def flutterwave_verify
    transaction_id = params[:transaction_id]
    return render json: { success: false, message: "transaction_id required" }, status: :unprocessable_entity unless transaction_id.present?

    service = FlutterwaveService.new
    result = service.verify_transaction(transaction_id)

    if result[:success]
      invoice = current_user.invoices.find_by(id: params[:invoice_id])
      if invoice && !invoice.paid?
        payment = Payment.record_payment(
          user:    current_user,
          invoice: invoice,
          amount:  result[:amount],
          method:  "bank_card",
          reference: result[:transaction_id].to_s
        )
        render json: { success: true, data: { payment: payment_json(payment) } }
      else
        render json: { success: true, message: "Already recorded or invoice not found" }
      end
    else
      render json: { success: false, message: result[:message] }
    end
  end

  # GET /api/v1/payments/admin/all — Admin views all payments
  def index_all
    payments = Payment.includes(:user, :invoice).recent
    payments = payments.where(user_id: params[:user_id]) if params[:user_id].present?
    payments = payments.where(status: params[:status]) if params[:status].present?
    payments = payments.where(payment_method: params[:payment_method]) if params[:payment_method].present?

    # Aging report: group unpaid invoices by overdue days
    aging = {
      current:  Invoice.where("due_date >= ?", Date.current).unpaid.sum(:total_amount),
      days_30:  Invoice.where("due_date < ? AND due_date >= ?", Date.current, 30.days.ago).unpaid.sum(:total_amount),
      days_60:  Invoice.where("due_date < ? AND due_date >= ?", 30.days.ago, 60.days.ago).unpaid.sum(:total_amount),
      days_90:  Invoice.where("due_date < ?", 60.days.ago).unpaid.sum(:total_amount)
    }

    render json: {
      success: true,
      data: {
        payments: payments.map { |p| payment_json(p, include_user: true) },
        aging_report: aging,
        total_collected: payments.where(status: "completed").sum(:amount)
      }
    }
  end

  # POST /api/v1/payments/record — Admin manually records a payment
  def record
    user    = User.find(params[:user_id])
    invoice = Invoice.find_by(id: params[:invoice_id])
    payment = Payment.record_payment(
      user:    user,
      invoice: invoice,
      amount:  params[:amount],
      method:  params[:payment_method] || "cash",
      reference: params[:transaction_reference]
    )
    render json: { success: true, message: "Payment recorded", data: { payment: payment_json(payment) } }, status: :created
  rescue => e
    render json: { success: false, message: e.message }, status: :unprocessable_entity
  end

  # POST /api/v1/payments/bulk_prompt — Admin sends STK Push to individual / group / all
  # params:
  #   scope: "individual" | "group" | "all"
  #   user_id: (if scope == "individual")
  #   zone: (if scope == "group")
  #   payment_method: "mpesa" | "airtel_money"
  #   message: optional custom message
  def bulk_prompt
    scope  = params[:scope] || "individual"
    method = params[:payment_method] || "mpesa"
    results = []

    users = case scope
            when "individual"
              User.where(id: params[:user_id])
            when "group"
              # Group by zone
              User.joins(:connections).where(connections: { zone: params[:zone], connection_status: "active" }).distinct
            else # "all"
              User.joins(:connections).where(connections: { connection_status: "active" })
                  .joins(:invoices).where(invoices: { status: %w[sent overdue] }).distinct
            end

    users.find_each do |user|
      invoice = user.invoices.unpaid.order(:due_date).first
      next unless invoice && user.phone.present?

      phone = normalize_phone(user.phone)
      next unless phone

      begin
        result = case method
                 when "mpesa"
                   svc = MpesaService.new
                   svc.stk_push(phone_number: phone, amount: invoice.total_amount.to_i,
                                account_ref: invoice.invoice_number,
                                description: "Water Bill #{invoice.invoice_number}")
                 when "airtel_money"
                   svc = AirtelMoneyService.new
                   svc.collect(phone_number: phone, amount: invoice.total_amount,
                               reference: invoice.invoice_number)
                 end

        if result&.dig(:success)
          # Record a pending payment
          PendingPayment.create!(
            user:                user,
            invoice:             invoice,
            amount:              invoice.total_amount,
            payment_method:      method,
            checkout_request_id: result[:checkout_request_id] || result[:transaction_id],
            status:              "pending",
            initiated_by:        current_user
          ) rescue nil

          results << { user_id: user.id, name: user.display_name, success: true, message: "STK push sent" }
        else
          results << { user_id: user.id, name: user.display_name, success: false, message: "Failed" }
        end
      rescue => e
        results << { user_id: user.id, name: user.display_name, success: false, message: e.message }
      end
    end

    successful = results.count { |r| r[:success] }
    render json: {
      success: true,
      message: "Bulk prompt sent: #{successful}/#{results.size} successful",
      data: { results: results, summary: { total: results.size, successful: successful, failed: results.size - successful } }
    }
  end

  # POST /api/v1/payments/bulk_stk_push (alias for bulk_prompt)
  alias bulk_stk_push bulk_prompt

  private

  def initiate_mpesa_stk(invoice, amount, user)
    phone = normalize_phone(user.phone)
    unless phone
      return render json: { success: false, message: "Invalid or missing phone number for M-Pesa" }, status: :unprocessable_entity
    end

    service = MpesaService.new
    result  = service.stk_push(
      phone_number: phone,
      amount:       amount.to_i,
      account_ref:  invoice.invoice_number,
      description:  "Water Bill #{invoice.invoice_number}"
    )

    # Store pending payment record
    PendingPayment.create!(
      user:                user,
      invoice:             invoice,
      amount:              amount,
      payment_method:      "mpesa",
      checkout_request_id: result[:checkout_request_id],
      status:              "pending",
      initiated_by:        user
    ) rescue nil

    render json: {
      success:          true,
      message:          result[:customer_message] || "M-Pesa payment request sent. Please enter your PIN.",
      payment_method:   "mpesa",
      checkout_request_id: result[:checkout_request_id]
    }
  rescue MpesaService::MpesaError => e
    render json: { success: false, message: e.message }, status: :unprocessable_entity
  end

  def initiate_airtel(invoice, amount, user)
    phone = normalize_phone(user.phone)
    unless phone
      return render json: { success: false, message: "Invalid or missing phone number for Airtel Money" }, status: :unprocessable_entity
    end

    service = AirtelMoneyService.new
    result  = service.collect(phone_number: phone, amount: amount, reference: invoice.invoice_number)

    PendingPayment.create!(
      user:                user,
      invoice:             invoice,
      amount:              amount,
      payment_method:      "airtel_money",
      checkout_request_id: result[:transaction_id],
      status:              "pending",
      initiated_by:        user
    ) rescue nil

    render json: {
      success:        true,
      message:        result[:message] || "Airtel Money request sent. Please enter your PIN.",
      payment_method: "airtel_money",
      transaction_id: result[:transaction_id]
    }
  rescue AirtelMoneyService::AirtelError => e
    render json: { success: false, message: e.message }, status: :unprocessable_entity
  end

  def initiate_card_payment(invoice, amount, user)
    service = FlutterwaveService.new
    result  = service.create_payment_link(user: user, invoice: invoice, amount: amount)

    render json: {
      success:        true,
      message:        "Redirect to payment page",
      payment_method: "card",
      payment_link:   result[:payment_link],
      tx_ref:         result[:tx_ref]
    }
  rescue FlutterwaveService::FlutterwaveError => e
    render json: { success: false, message: e.message }, status: :unprocessable_entity
  end

  def record_payment_directly(invoice, amount, method, reference)
    payment = Payment.record_payment(
      user:    current_user,
      invoice: invoice,
      amount:  amount,
      method:  method,
      reference: reference
    )

    Notification.create!(
      user_id: current_user.id,
      title: "Payment Received",
      message: "Payment of KES #{payment.amount} received. Ref: #{payment.transaction_reference}.",
      category: "billing", notification_type: "payment", priority: "normal",
      action_url: "/client/payment-history"
    )
    CrossDashboardService.on_payment_made(payment)

    render json: { success: true, message: "Payment recorded", data: { payment: payment_json(payment) } }, status: :created
  end

  def normalize_phone(phone)
    return nil unless phone.present?
    digits = phone.to_s.gsub(/\D/, "")
    return "254#{digits[-9..]}" if digits.length >= 9
    nil
  end

  def authorize_admin!
    unless current_user&.admin? || current_user&.super_admin?
      render json: { success: false, message: "Unauthorized" }, status: :forbidden
    end
  end

  def payment_json(payment, include_user: false)
    data = {
      id: payment.id,
      transaction_reference: payment.transaction_reference,
      amount: payment.amount,
      payment_method: payment.payment_method,
      status: payment.status,
      payment_date: payment.payment_date,
      notes: payment.notes,
      invoice: payment.invoice ? {
        id: payment.invoice.id, invoice_number: payment.invoice.invoice_number,
        total_amount: payment.invoice.total_amount
      } : nil,
      created_at: payment.created_at
    }
    data[:user] = { id: payment.user.id, name: payment.user.display_name, phone: payment.user.phone } if include_user
    data
  end
end
