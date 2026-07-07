class Api::V1::Admin::InventoryController < ApplicationController
  before_action :authenticate_request
  before_action :ensure_admin

  def index
    items = InventoryItem.all
    items = items.by_category(params[:category]) if params[:category].present?
    items = items.low_stock if params[:low_stock] == 'true'
    render_success({ items: items.recent.map { |i| item_json(i) },
                     low_stock_count: InventoryItem.low_stock.count }, 'Inventory retrieved')
  end

  def create
    item = InventoryItem.new(item_params)
    item.created_by = current_user
    if item.save
      render_success({ item: item_json(item) }, 'Item created', :created)
    else
      render_error('Failed to create item', item.errors.full_messages)
    end
  end

  def update
    item = InventoryItem.find(params[:id])
    if item.update(item_params)
      render_success({ item: item_json(item) }, 'Item updated')
    else
      render_error('Failed to update item', item.errors.full_messages)
    end
  end

  # POST /api/v1/admin/inventory/:id/transaction
  def transaction
    item = InventoryItem.find(params[:id])
    txn = InventoryTransaction.new(
      inventory_item: item,
      transaction_type: params[:transaction_type],
      quantity: params[:quantity].to_i,
      recorded_by: current_user,
      notes: params[:notes]
    )
    if txn.save
      render_success({ item: item_json(item.reload), transaction: { type: txn.transaction_type, quantity: txn.quantity } }, 'Transaction recorded')
    else
      render_error('Failed to record transaction', txn.errors.full_messages)
    end
  end

  private

  def ensure_admin
    render_error('Access denied.', [], :forbidden) unless current_user&.admin? || current_user&.super_admin?
  end

  def item_params
    params.require(:item).permit(:item_name, :item_code, :category, :quantity_in_stock, :reorder_level, :unit, :unit_cost, :supplier, :notes)
  end

  def item_json(i)
    { id: i.id, item_name: i.item_name, item_code: i.item_code, category: i.category,
      quantity_in_stock: i.quantity_in_stock, reorder_level: i.reorder_level,
      unit: i.unit, unit_cost: i.unit_cost, supplier: i.supplier,
      low_stock: i.low_stock?, created_at: i.created_at }
  end
end
