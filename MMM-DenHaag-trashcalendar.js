console.error("semih");
Module.register("MMM-DenHaag-TrashCalendar", {
    defaults: {
        zipCode: "2493ZP",
        houseNr: 10,
        dateFormat: "dddd D MMMM",
        numberOfItems: 10,
        updateInterval: 4 * 60 * 60 * 1000 // Defaults to 4 hours
    },

    // Start the module
    start: function() {
        this.payload = [];
        this.loaded = false;
        this.getTrashCollectionDays();
        this.scheduleUpdate();
    },

    // Import additional CSS Styles
    getStyles: function() {
        return ['MMM-DenHaag-trashcalendar.css']
    },

    // Contact node_helper for the trash collection days
    getTrashCollectionDays: function() {
        this.sendSocketNotification("GET_TRASH_DATA", {
            config: this.config
        });
    },

    // Schedule the update interval and update
    scheduleUpdate: function(delay) {
        let nextLoad = this.config.updateInterval;
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay;
        }

        const self = this;
        setInterval(function() {
            self.getTrashCollectionDays();
        }, nextLoad);
    },

    // Handle node_helper response
    socketNotificationReceived: function(notification, payload) {
        if (notification === "TRASH_DATA") {
            this.payload = payload;
            this.loaded = true;
            this.updateDom(1000);
        }
    },

    // Create icons
    getIconByTrashtype: function (trash_type) {
        let color = "#64656a";

        switch (trash_type) {
            case 4:
                color = "#64656a";
                break;
            case 1:
                color = "#418740";
                break;
            case 2:
                color = "#e96c29";
                break;
            case 3:
                color = "#2a70b8";
                break;
            case 5:
                color = "#32ff17";
            break;
            default:
                color = "#64656a";
                break;
        }

        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttributeNS(null, "class", "binday-icon");
        svg.setAttributeNS(null, "style", "fill: " + color);

        let use = document.createElementNS('http://www.w3.org/2000/svg', "use");
        use.setAttributeNS("http://www.w3.org/1999/xlink", "href", this.file("bin_icon.svg#bin"));
        svg.appendChild(use);

        return (svg);
    },

    // Create labels
    getNameByTrashType: function (trash_type) {
        switch (trash_type) {
            case 4:
                return "Rest";
            case 1:
                return "GFT";
            case 2:
		        return "PMD";
            case 3:
		        return "Papier";
	        case 5:
		        return "Tree";
            default:
		        return "Unknown:" + trash_type;
        }
    },

    capitalize: function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },

    // Construct the DOM objects for this module
    getDom: function() {
        let wrapper = document.createElement("div");

        if (this.loaded === false) {
            wrapper.innerHTML = this.translate("Loading...");
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if(this.payload.error == true){
            wrapper.innerHTML = this.translate(this.payload.message);
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        for (i = 0; i < this.payload.length; i++) {
            let trashDay = this.payload[i];

            let pickupContainer = document.createElement("div");
            pickupContainer.classList.add("binday-container");

            let dateContainer = document.createElement("span");
            dateContainer.classList.add("binday-date");

            moment.locale();
            let today = moment().startOf("day");
            let pickUpDate = moment(trashDay.ophaaldatum);
	        let pickUpDay = pickUpDate.startOf("day");
            if (today.isSame(pickUpDay)) {
                dateContainer.innerHTML = "Today";
		        pickupContainer.classList.add("today-container");
            } else if (moment(today).add(1, "days").isSame(pickUpDay)) {
                dateContainer.innerHTML = "Tomorrow";
		        pickupContainer.classList.add("tomorrow-container");
            } else if (moment(today).add(7, "days").isAfter(pickUpDate)) {
                dateContainer.innerHTML = this.capitalize(pickUpDate.format("dddd"));
            } else {
                dateContainer.innerHTML = this.capitalize(pickUpDate.format(this.config.dateFormat));
            }
            dateContainer.innerHTML += ": " + this.getNameByTrashType(trashDay.afvalstroom_id);

            let iconContainer = document.createElement("span");
            iconContainer.classList.add("binday-icon-container");
            iconContainer.appendChild(this.getIconByTrashtype(trashDay.afvalstroom_id));

            pickupContainer.appendChild(iconContainer);
	        pickupContainer.appendChild(dateContainer);

            wrapper.appendChild(pickupContainer);
        }

        return wrapper;
    }
});
