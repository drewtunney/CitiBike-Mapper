Citibike::Application.routes.draw do
  
  get "/stations", to: "stations#index"

  root "directions#show"

end
