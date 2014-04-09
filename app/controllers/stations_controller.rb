class StationsController <ApplicationController

  def index
    @stations = HTTParty.get("http://citibikenyc.com/stations/json")
    render json: @stations
  end

end