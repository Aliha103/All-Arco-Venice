          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            {/* Pricing Settings Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                  Pricing Settings
                </CardTitle>
                <CardDescription>Manage your property's pricing structure and discounts</CardDescription>
              </CardHeader>
              <CardContent>
                {pricingLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="basePrice" className="text-sm font-semibold text-gray-700">Base Price per Night (€)</Label>
                        <Input
                          id="basePrice"
                          type="number"
                          value={pricingForm.basePrice}
                          onChange={(e) => setPricingForm({ ...pricingForm, basePrice: parseFloat(e.target.value) || 0 })}
                          className="text-lg font-medium border-2 border-blue-200 focus:border-blue-500"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cleaningFee" className="text-sm font-semibold text-gray-700">Cleaning Fee (€)</Label>
                        <Input
                          id="cleaningFee"
                          type="number"
                          value={pricingForm.cleaningFee}
                          onChange={(e) => setPricingForm({ ...pricingForm, cleaningFee: parseFloat(e.target.value) || 0 })}
                          className="text-lg font-medium border-2 border-blue-200 focus:border-blue-500"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="petFee" className="text-sm font-semibold text-gray-700">Pet Fee (€)</Label>
                        <Input
                          id="petFee"
                          type="number"
                          value={pricingForm.petFee}
                          onChange={(e) => setPricingForm({ ...pricingForm, petFee: parseFloat(e.target.value) || 0 })}
                          className="text-lg font-medium border-2 border-blue-200 focus:border-blue-500"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discountWeekly" className="text-sm font-semibold text-gray-700">Weekly Discount (%)</Label>
                        <Input
                          id="discountWeekly"
                          type="number"
                          value={pricingForm.discountWeekly}
                          onChange={(e) => setPricingForm({ ...pricingForm, discountWeekly: parseFloat(e.target.value) || 0 })}
                          className="text-lg font-medium border-2 border-green-200 focus:border-green-500"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="0.0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discountMonthly" className="text-sm font-semibold text-gray-700">Monthly Discount (%)</Label>
                        <Input
                          id="discountMonthly"
                          type="number"
                          value={pricingForm.discountMonthly}
                          onChange={(e) => setPricingForm({ ...pricingForm, discountMonthly: parseFloat(e.target.value) || 0 })}
                          className="text-lg font-medium border-2 border-green-200 focus:border-green-500"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="0.0"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button 
                        onClick={() => updatePricingMutation.mutate(pricingForm)}
                        disabled={updatePricingMutation.isPending}
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                      >
                        {updatePricingMutation.isPending ? "Updating..." : "Update Pricing Settings"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Promotional Offers Card */}
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-600" />
                  Promotional Offers
                </CardTitle>
                <CardDescription>Create and manage special offers to boost bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Spring Sale Promo */}
                  <div className="p-4 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-xl shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-yellow-800">Spring Sale!</h3>
                        <p className="text-sm text-yellow-700">20% off for stays in May</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-yellow-800 border-yellow-600 hover:bg-yellow-300">
                        Edit
                      </Button>
                    </div>
                  </div>

                  {/* Summer Special Promo */}
                  <div className="p-4 bg-gradient-to-br from-orange-200 to-orange-400 rounded-xl shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-orange-800">Summer Special!</h3>
                        <p className="text-sm text-orange-700">15% off for 7+ nights</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-orange-800 border-orange-600 hover:bg-orange-300">
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button 
                    onClick={() => setShowPromotionForm(!showPromotionForm)}
                    className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Promotion
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Pricing Preview */}
            <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-6 h-6 text-gray-600" />
                  Current Pricing Preview
                </CardTitle>
                <CardDescription>Preview of your current pricing structure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Base Price per Night:</span>
                      <span className="text-xl font-bold text-blue-600">{formatCurrency(pricingForm.basePrice)}</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Cleaning Fee:</span>
                      <span className="text-xl font-bold text-green-600">{formatCurrency(pricingForm.cleaningFee)}</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Pet Fee:</span>
                      <span className="text-xl font-bold text-purple-600">{formatCurrency(pricingForm.petFee)}</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Weekly Discount:</span>
                      <span className="text-xl font-bold text-orange-600">{pricingForm.discountWeekly}%</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Monthly Discount:</span>
                      <span className="text-xl font-bold text-red-600">{pricingForm.discountMonthly}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
