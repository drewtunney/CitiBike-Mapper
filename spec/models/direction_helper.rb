require 'spec_helper'

describe Station do
  it { should validate_presence_of :id }
  it { should validate_presence_of :station_name }
  it { should validate_presence_of :latitude }
  it { should validate_presence_of :longitude }
  it { should validate_presence_of :status_key }
end