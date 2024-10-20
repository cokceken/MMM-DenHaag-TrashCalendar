const request = require('request');
const node_helper = require("node_helper");

module.exports = node_helper.create({
	socketNotificationReceived: function(notification, payload)
	{
		const self = this;

		if(notification === "GET_TRASH_DATA")
		{
			let returnData = {error: true};

			request({
				method: 'GET',
				uri: `https://huisvuilkalender.denhaag.nl/adressen/${payload.config.zipCode}:${payload.config.houseNr}`
			}, function (error, response, body)
			{
				if (error || response.statusCode !== 200) {
					console.error("Error fetching address ID:", error || response.statusCode);
					returnData.message = "Error fetching address ID";
					self.sendSocketNotification("TRASH_DATA", returnData);
					return;
				}

				let addressId;
				try {
					const addressData = JSON.parse(body);
					if (Array.isArray(addressData) && addressData.length > 0) {
						addressId = addressData[0].bagid;
					} else {
						throw new Error("Invalid address data");
					}
				} catch (parseError) {
					console.error("Error parsing address data:", parseError, body);
					returnData.message = "Error parsing address data";
					self.sendSocketNotification("TRASH_DATA", returnData);
					return;
				}

				request({method: 'GET', uri: `https://huisvuilkalender.denhaag.nl/rest/adressen/${addressId}/kalender/${new Date().getFullYear()}`},
					function (error, response, body){
						if (error || response.statusCode !== 200) {
							console.error("Error fetching trash data:", error || response.statusCode);
							returnData.message = "Error fetching trash data";
							self.sendSocketNotification("TRASH_DATA", returnData);
							return;
						}

						try {
							const trashData = JSON.parse(body);
							const currentDate = new Date();

							returnData = trashData
								.filter((item) => {
									const ophaaldatum = new Date(item.ophaaldatum);
									return ophaaldatum >= currentDate;
								})
								.slice(0, payload.config.numberOfItems);
							
							if (returnData.length === 0) {
								returnData = { error: true, message: "No upcoming trash data available" };
							}
						} catch (parseError) {
							console.error("Error parsing trash data:", parseError);
							returnData = { error: true, message: "Failed to parse trash data" };
						}

						// Send the processed data
						self.sendSocketNotification("TRASH_DATA", returnData);
					});
			});
		}
	},
});
