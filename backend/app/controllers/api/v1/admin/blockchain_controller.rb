class Api::V1::Admin::BlockchainController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  # GET /api/v1/admin/blockchain/ledger
  def ledger
    records = BlockchainRecord.recent.limit(100)

    records = records.by_type(params[:record_type]) if params[:record_type].present?
    records = records.where(status: params[:status])  if params[:status].present?

    stats = {
      total_records:     BlockchainRecord.count,
      confirmed:         BlockchainRecord.confirmed.count,
      pending:           BlockchainRecord.pending.count,
      total_value:       BlockchainRecord.confirmed.sum(:amount).to_f,
      by_type:           BlockchainRecord.group(:record_type).count,
      latest_block:      BlockchainRecord.maximum(:block_number) || 0
    }

    render_success({
      records: records.map { |r| serialize_record(r) },
      stats:   stats
    }, 'Blockchain ledger retrieved')
  end

  # POST /api/v1/admin/blockchain/records
  def create
    record = BlockchainRecord.new(record_params)
    record.created_by = current_user

    if record.save
      render_success({ record: serialize_record(record) }, 'Record added to blockchain', :created)
    else
      render_error('Failed to create record', record.errors.full_messages)
    end
  end

  # GET /api/v1/admin/blockchain/records/:id
  def show
    record = BlockchainRecord.find(params[:id])
    render_success({ record: serialize_record(record) }, 'Record retrieved')
  rescue ActiveRecord::RecordNotFound
    render_error('Record not found', [], :not_found)
  end

  # GET /api/v1/admin/blockchain/verify/:hash
  def verify
    record = BlockchainRecord.find_by(transaction_hash: params[:hash])
    if record
      render_success({
        valid:   true,
        record:  serialize_record(record),
        message: 'Transaction hash verified on ledger'
      }, 'Verification successful')
    else
      render_success({ valid: false, message: 'Hash not found on ledger' }, 'Verification complete')
    end
  end

  # GET /api/v1/admin/blockchain/donor_summary
  def donor_summary
    grants = Grant.includes(:blockchain_records).all rescue []
    summary = grants.map do |g|
      {
        id:           g.id,
        donor:        g.donor_name,
        title:        g.title,
        total_amount: g.amount.to_f,
        status:       g.status,
        blockchain_records: BlockchainRecord.where(reference_type: 'Grant', reference_id: g.id).count
      }
    end
    render_success({ donors: summary }, 'Donor summary retrieved')
  end

  private

  def record_params
    params.require(:blockchain_record).permit(
      :record_type, :reference_id, :reference_type,
      :amount, :currency, :metadata, :network, :smart_contract_address
    )
  end

  def serialize_record(r)
    {
      id:                      r.id,
      record_type:             r.record_type,
      transaction_hash:        r.transaction_hash,
      block_hash:              r.block_hash,
      block_number:            r.block_number,
      status:                  r.status,
      reference_id:            r.reference_id,
      reference_type:          r.reference_type,
      amount:                  r.amount.to_f,
      currency:                r.currency,
      network:                 r.network,
      smart_contract_address:  r.smart_contract_address,
      gas_used:                r.gas_used,
      confirmed_at:            r.confirmed_at,
      created_at:              r.created_at,
      created_by:              r.created_by&.display_name,
      metadata:                r.metadata_hash
    }
  end

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end
end
