class DirectionsController <ApplicationController

  def show
    get_stations
  end

  private

  def get_stations
    @stations = HTTParty.get("http://citibikenyc.com/stations/json")
  end

end