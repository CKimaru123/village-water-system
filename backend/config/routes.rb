Rails.application.routes.draw do
  # Mount letter_opener_web for email preview in development
  if Rails.env.development?
    mount LetterOpenerWeb::Engine, at: "/letter_opener"
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  get "up" => "rails/health#show", as: :rails_health_check

  # Mount ActionCable for WebSocket connections
  mount ActionCable.server => '/cable'

  # API routes
  namespace :api do
    namespace :v1 do
      get 'health', to: 'health#show' # Add this line
      # Contact routes (public for create, protected for others)
      resources :contacts, only: [:create, :index, :show, :update, :destroy]
      
      # Content Management routes (public for index/show, admin-only for CUD operations)
      resources :gallery_items, only: [:index, :show, :create, :update, :destroy]
      resources :marketplace_items, only: [:index, :show, :create, :update, :destroy]
      resources :blog_posts, only: [:index, :show, :create, :update, :destroy] do
        member do
          post :like
        end
      end
      
      # Authentication routes (public)
      namespace :auth do
        post 'signup', to: 'registrations#create'  # Creates clients only
        post 'login', to: 'sessions#create'
        delete 'logout', to: 'sessions#destroy'
        get 'me', to: 'sessions#show'
        patch 'me', to: 'sessions#update'          # Update user profile
        post 'refresh', to: 'sessions#refresh'
        put 'change_password', to: 'sessions#change_password'
        post 'forgot-password', to: 'password_resets#create'
        post 'reset-password', to: 'password_resets#reset'
      end

      # Admin Management routes (super admin only, except index which allows regular admin)
      resources :admin_management, path: 'admin_management/users', controller: 'admin_management' do
        member do
          post :promote_to_admin
          post :demote_to_client
          post :suspend
          post :activate
        end
      end

      # Client Profile Management routes (admin and super admin)
      resources :client_profile_management, path: 'client_profile_management', controller: 'client_profile_management', only: [:show, :update] do
        member do
          get :permissions
          get :audit_trail
          post :add_note
        end
      end

      # Client routes for accessing their own data
      namespace :client do
        get 'profile/audit_trail', to: 'profile#audit_trail'

        # Dashboard
        get 'dashboard', to: 'dashboard#show'

        # Billing
        get 'current_bill',    to: 'billing#current_bill'
        get 'payments',        to: 'billing#payments'
        get 'export',          to: 'billing#export'
        get 'meter_readings',  to: 'billing#meter_readings'

        # Usage
        get 'usage_overview',       to: 'usage#overview'
        get 'consumption_trends',   to: 'usage#trends'
        get 'leak_alerts',          to: 'usage#leak_alerts'
        get 'carbon_footprint',     to: 'usage#carbon_footprint'

        # Settings
        get   'notification_preferences',    to: 'settings#notification_preferences'
        patch 'notification_preferences',    to: 'settings#update_notification_preferences'
        get   'language_settings',           to: 'settings#language_settings'
        patch 'language_settings',           to: 'settings#update_language_settings'
        get   'login_history',               to: 'settings#login_history'
      end

      # Notifications routes
      resources :notifications, only: [:index, :destroy] do
        member do
          patch :mark_read
        end
        collection do
          get :unread_count
          patch :mark_all_read
        end
      end

      # Status Management routes
      namespace :client do
        get 'status', to: 'status#show'
        post 'status/request-pause', to: 'status#request_pause'
        post 'status/request-reactivation', to: 'status#request_reactivation'
        get 'status/requests', to: 'status#requests'
        get 'status/history', to: 'status#history'
        
        resources :appeals, only: [:index, :create, :show]
      end

      namespace :admin do
        # Dashboard (2.1)
        get 'dashboard', to: 'dashboard#show'

        # Client Lookup (2.2) — search/list all clients
        get 'clients',     to: 'clients#index'
        get 'clients/:id', to: 'clients#show'

        # Status management (existing)
        resources :requests, only: [:index, :show] do
          member do
            post :approve
            post :deny
          end
        end
        get 'requests/pending-count', to: 'requests#pending_count'

        resources :appeals, only: [:index, :show] do
          member do
            post :approve
            post :deny
            post :mark_under_review
          end
        end

        # Finance (2.3-2.10)
        resources :tariffs, only: [:index, :show, :create, :update, :destroy]

        get  'dunning/overdue',       to: 'dunning#overdue'
        post 'dunning/send_reminder', to: 'dunning#send_reminder'

        resources :deposits, only: [:index, :create] do
          member { patch :confirm }
        end

        resources :refunds, only: [:index, :create] do
          member do
            patch :approve
            patch :reject
          end
        end

        get  'reconciliation/unmatched', to: 'reconciliation#unmatched'
        post 'reconciliation/match',     to: 'reconciliation#match'
        get  'reconciliation/summary',   to: 'reconciliation#summary'

        get 'financial_reports', to: 'financial_reports#index'

        resources :subsidies, only: [:index, :create] do
          member { patch :approve }
        end

        # Billing configs (global + per-client)
        get    'billing_configs',                to: 'billing_configs#index'
        get    'billing_configs/global',         to: 'billing_configs#show_global'
        patch  'billing_configs/global',         to: 'billing_configs#update_global'
        get    'billing_configs/:user_id',       to: 'billing_configs#show'
        patch  'billing_configs/:user_id',       to: 'billing_configs#update'
        delete 'billing_configs/:user_id',       to: 'billing_configs#destroy'

        # Reading schedules (global + per-meter)
        get    'reading_schedules',              to: 'reading_schedules#index'
        get    'reading_schedules/global',       to: 'reading_schedules#show_global'
        patch  'reading_schedules/global',       to: 'reading_schedules#update_global'
        get    'meters/:meter_id/schedule',      to: 'reading_schedules#show_meter'
        patch  'meters/:meter_id/schedule',      to: 'reading_schedules#update_meter'
        delete 'meters/:meter_id/schedule',      to: 'reading_schedules#destroy_meter'

        # Infrastructure (2.14-2.21)
        resources :assets, only: [:index, :show, :create, :update, :destroy]

        resources :maintenance, only: [:index, :create] do
          member { patch :complete }
        end

        resources :incidents, only: [:index, :show, :create, :update]

        get 'gis/layers', to: 'gis#layers'

        resources :valves, only: [:index, :create, :update]

        resources :inventory, only: [:index, :create, :update] do
          member { post :transaction }
        end

        resources :energy, only: [:index, :create]

        get  'scada/readings', to: 'scada#readings'
        post 'scada/readings', to: 'scada#create'

        # Community & transparency (2.25, 2.29-2.32, 2.37)
        get 'transparency/metrics', to: 'transparency#metrics'

        resources :contractors,  only: [:index, :create, :update]
        resources :procurement,  only: [:index, :create] do
          member { post :approve }
        end
        resources :grants,       only: [:index, :create, :update]
        resources :volunteers,   only: [:index, :create, :update]

        # Carbon footprint analysis (2.33)
        get 'carbon_footprint/analysis', to: 'carbon_footprint#analysis'

        # Support (2.34-2.36)
        get  'sla/breaches',              to: 'sla#breaches'
        post 'sla/tickets/:id/escalate',  to: 'sla#escalate'

        resources :canned_responses, only: [:index, :create, :update, :destroy]

        # Team collaboration (2.28)
        get   'collaboration/tasks',                          to: 'collaboration#tasks'
        get   'collaboration/tasks/:id',                      to: 'collaboration#show_task'
        post  'collaboration/tasks',                          to: 'collaboration#create_task'
        patch 'collaboration/tasks/:id',                      to: 'collaboration#update_task'
        delete 'collaboration/tasks/:id',                     to: 'collaboration#delete_task'
        get   'collaboration/admins',                         to: 'collaboration#admins'
        # Members
        post   'collaboration/tasks/:id/members',             to: 'collaboration#add_member'
        delete 'collaboration/tasks/:id/members/:user_id',    to: 'collaboration#remove_member'
        # Sub-tasks
        post   'collaboration/tasks/:id/subtasks',            to: 'collaboration#create_subtask'
        patch  'collaboration/tasks/:id/subtasks/:subtask_id', to: 'collaboration#update_subtask'
        delete 'collaboration/tasks/:id/subtasks/:subtask_id', to: 'collaboration#delete_subtask'
        # Comments
        get    'collaboration/tasks/:id/comments',            to: 'collaboration#task_comments'
        post   'collaboration/tasks/:id/comments',            to: 'collaboration#add_comment'

        # Audit & compliance (2.39)
        get 'audit_logs',                to: 'audit_logs#index'
        get 'audit_logs/profile_changes', to: 'audit_logs#profile_changes'

        # AI (2.50-2.52) — extended
        get   'ai/anomalies',                    to: 'ai#anomalies'
        get   'ai/anomalies/stats',              to: 'ai#anomaly_stats'
        patch 'ai/anomalies/:id/resolve',        to: 'ai#resolve_anomaly'
        patch 'ai/anomalies/:id/dismiss',        to: 'ai#dismiss_anomaly'
        get   'ai/maintenance_predictions',      to: 'ai#maintenance_predictions'
        get   'ai/segmentation',                 to: 'ai#segmentation'
        get   'ai/segmentation/export',          to: 'ai#segmentation_export'

        # Blockchain ledger
        get  'blockchain/ledger',                to: 'blockchain#ledger'
        post 'blockchain/records',               to: 'blockchain#create'
        get  'blockchain/records/:id',           to: 'blockchain#show'
        get  'blockchain/verify/:hash',          to: 'blockchain#verify'
        get  'blockchain/donor_summary',         to: 'blockchain#donor_summary'

        # Voice sessions
        get   'voice_sessions',                  to: 'voice_sessions#index'
        post  'voice_sessions',                  to: 'voice_sessions#create'
        patch 'voice_sessions/:id',              to: 'voice_sessions#update'
        get   'voice_sessions/stats',            to: 'voice_sessions#stats'

        # Export (2.12)
        get 'export', to: 'export#index'

        # Document generator (admin)
        post 'documents/generate', to: 'documents#generate'

        # Request Queue — aggregated pending items (3.2 / 2.58)
        get 'request_queue', to: 'request_queue#index'

        # Cross-dashboard summary
        get 'cross_dashboard/summary', to: 'cross_dashboard#summary'

        # System / Super Admin (2.46, 2.48)
        get  'system/health',      to: 'system#health'
        post 'system/data_import', to: 'system#data_import'

      end # end namespace :admin

      # Debug routes (development only)
      if Rails.env.development?
        get 'debug/users', to: 'debug#users'           # View all users
        get 'debug/latest', to: 'debug#latest_user'    # View latest user
      end

      # Connection Management routes
      resources :connections, only: [:index, :show, :create, :update, :destroy] do
        collection do
          get :me  # Get current user's connection
        end
      end

      # Document Management routes
      resources :documents, only: [:index, :show, :create, :destroy] do
        collection do
          get :me       # Get current user's documents
          get :pending  # Get pending documents (admin only)
        end
        member do
          get :download
          patch :verify  # Verify document (admin only)
          patch :reject  # Reject document (admin only)
        end
      end

      # Tree Planting routes (client submits, admin verifies)
      resources :tree_plantings, only: [:index, :show, :create, :update, :destroy] do
        member do
          post  :growth_update, to: "tree_plantings#add_growth_update"
          get   "photos/:photo_id", to: "tree_plantings#serve_photo", as: :photo
          patch :verify
          patch :reject
        end
        collection do
          get :pending, to: "tree_plantings#index"  # admin uses ?status=pending
        end
      end

      # Meter Reading routes
      resources :meter_readings, only: [:index, :show, :create, :update, :destroy]

      # Tickets (client + admin)
      resources :tickets, only: [:index, :show, :create, :update] do
        member do
          post :updates, to: 'tickets#add_update'
          patch :respond, to: 'tickets#add_update'  # admin alias
        end
        collection do
          get :admin_all, to: 'tickets#index_all'
        end
      end

      # Payments (client + admin)
      resources :payments, only: [:index, :create] do
        collection do
          get  :admin_all,         to: 'payments#index_all'
          post :record,            to: 'payments#record'
          post :bulk_prompt,       to: 'payments#bulk_prompt'
          post :bulk_stk_push,     to: 'payments#bulk_stk_push'
          post :flutterwave_verify, to: 'payments#flutterwave_verify'
        end
      end

      # Payment gateway callbacks (no auth — verified by payload)
      post 'payments/mpesa_callback',       to: 'payments#mpesa_callback'
      post 'payments/airtel_callback',      to: 'payments#airtel_callback'
      post 'payments/flutterwave_callback', to: 'payments#flutterwave_callback'

      # IoT / Smart Meter ingestion endpoints (hardware token auth)
      namespace :iot do
        post 'readings',             to: '/api/v1/iot#create_reading'
        get  'meters/:serial/status', to: '/api/v1/iot#meter_status'
      end

      # Announcements
      resources :announcements, only: [:index, :show, :create, :update, :destroy]

      # Polls
      resources :polls, only: [:index, :show, :create, :update, :destroy] do
        member do
          post :vote
          get  :results
        end
      end

      # Events
      resources :events, only: [:index, :show, :create, :update, :destroy] do
        member do
          post  :rsvp,  to: 'event_rsvps#upsert'
          get   :rsvp,  to: 'event_rsvps#show'
          get   :rsvps, to: 'event_rsvps#index'   # admin: list all RSVPs
        end
      end

      # Projects
      resources :projects, only: [:index, :show, :create, :update, :destroy]

      # Knowledge Base (public read, admin write)
      namespace :knowledge_base do
        resources :articles, only: [:index, :show, :create, :update, :destroy], controller: '/api/v1/knowledge_base' do
          collection do
            get :admin_all, to: '/api/v1/knowledge_base#admin_index'
          end
        end
      end
      get 'faqs',                  to: 'knowledge_base#faqs'
      get 'water_quality_reports', to: 'knowledge_base#water_quality_reports'

      # Chat Messages (REST + ActionCable fallback)
      resources :chat_messages, only: [:index, :create] do
        collection do
          get :sessions  # admin: list all active chat sessions
        end
      end

      # WhatsApp Webhook Endpoint (RECEIVE ONLY - Meta will call this)
      get  '/webhooks/whatsapp', to: 'whatsapp#verify'   # For Facebook's verification handshake
      post '/webhooks/whatsapp', to: 'whatsapp#receive'  # For actual inbound messages/status/updates

      # Community Tasks + Volunteer sign-ups
      resources :community_tasks, only: [:index, :show, :create, :update, :destroy] do
        member do
          post :volunteer
          delete :leave
        end
      end

      # Payment Plans
      resources :payment_plans, only: [:index, :create] do
        member { patch :approve }
      end
      
      # Simple health check endpoint
      get '/health', to: proc { [200, { 'Content-Type' =>   'text/plain' }, ['OK']] }
      # Invoices
      resources :invoices, only: [:index, :show, :update] do        collection do
          post  :generate
          get   :current
          get   :admin_all, to: 'invoices#index_all'
        end
        member do
          patch :send_invoice
          patch :mark_paid
        end
      end
    end
  end

  # Defines the root path route ("/")
  # root "posts#index"
end
