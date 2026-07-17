module Api
  module V1
    # class Api::V1::HealthController < ApplicationController
    class HealthController < ApplicationController
      def show
        render json: { status: 'OK', message: 'Backend is alive and running!' }
      end
    end
  end
end