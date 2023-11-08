// Javascript for index.html (website home-page)

let floorPlans = [];
let currentFloorPlanIndex = -1;  // Initialize to -1
let currentLocationName = '';  // Initialize to an empty string
let selectedLocationId = null;
let locations = [];
let drawnItems = L.featureGroup(); // Initialize drawnItems as an empty Leaflet Feature Group
let map;
let selectedRoom = null;
let previouslySelectedRoom = null;
let roomDetails = {};
let roomTypes = null;
let selectedBuildingPriority = null;

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
let csrftoken = getCookie('csrftoken');

// *****************************************
// Get building locations and render them in the list
function getLocations() {
    fetch('/data/locations/')
        .then(response => response.json())
        .then(data => {
            locations = data.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name
            renderLocations();
        });
}


function renderLocations() {
    let list = document.getElementById('location-list');
    let buildingPrioritySelect = document.getElementById('building-priority-select');

    list.innerHTML = '';
    let searchValue = document.getElementById('search').value.toLowerCase();

    // Assume no building is selected initially
    let isBuildingSelected = false;

    // Add event listener to update button
    update_button = document.getElementById('update-priority-btn');
    update_button.addEventListener('click', function() {
        let selectedValue = document.getElementById('building-priority-select').value;
        updateLocationPriority(selectedLocationId, selectedValue);
    });

    locations.forEach((location, index) => {
        if (location.name.toLowerCase().includes(searchValue)) {
            let item = document.createElement('li');
            item.classList.add('list-group-item', 'list-group-item-action');

            // Create the priority indicator element
            let priorityIndicator = document.createElement('span');
            priorityIndicator.classList.add('priority-indicator');
            let icon = document.createElement('i'); // Using <i> for the icon

            // Set the icon and color based on the building_priority
            switch (location.building_priority) {
                case 0:
                    priorityIndicator.classList.add('bg-grey');
                    priorityIndicator.title = 'None';
                    break;
                case 1:
                    priorityIndicator.classList.add('bg-green');
                    icon.classList.add('bi', 'bi-check-circle-fill');
                    priorityIndicator.title = 'Done';
                    break;
                case 2:
                    priorityIndicator.classList.add('bg-yellow');
                    icon.classList.add('bi', 'bi-exclamation-circle-fill');
                    priorityIndicator.title = 'Intermediate Priority';
                    break;
                case 3:
                    priorityIndicator.classList.add('bg-red');
                    icon.classList.add('bi', 'bi-exclamation-triangle-fill');
                    priorityIndicator.title = 'High Priority';
                    break;
                default:
                    priorityIndicator.classList.add('bg-grey');
                    icon.classList.add('bi', 'bi-circle');
                    priorityIndicator.title = 'Unknown';
                    break;
            }

            priorityIndicator.appendChild(icon);
            priorityIndicator.id = 'priority-indicator-' + location.id;
            item.appendChild(priorityIndicator);
            item.appendChild(document.createTextNode(` ${location.name}`));

            item.addEventListener('click', function() {
                let previousSelectedItem = document.querySelector('.list-group-item.active');
                if (previousSelectedItem) {
                    previousSelectedItem.classList.remove('active');
                }
                item.classList.add('active');
                selectedLocationId = location.id;

                getFloorPlans(location.id);
                currentLocationName = location.name;
                currentFloorPlanIndex = 0;

                // Enable the dropdown and set its value to the current building's priority
                buildingPrioritySelect.disabled = false;
                update_button.disabled = false;
                buildingPrioritySelect.value = location.building_priority.toString();

                // Set the dropdown value either to the current building's priority or the stored selected priority if available
                buildingPrioritySelect.value = selectedBuildingPriority !== null ? selectedBuildingPriority.toString() : location.building_priority.toString();

                // Reset the selectedBuildingPriority after using it to set the dropdown
                selectedBuildingPriority = null;

            });
            list.appendChild(item);

            // Check if the location is selected to set the dropdown state appropriately
            if (location.id === selectedLocationId) {
                isBuildingSelected = true;
                buildingPrioritySelect.value = location.building_priority.toString();
            }
        }
    });

    // After rendering all locations, if a location is selected, set the dropdown value
    if (selectedLocationId && selectedBuildingPriority !== null) {
        buildingPrioritySelect.value = selectedBuildingPriority.toString();
        selectedBuildingPriority = null; // Reset the stored priority
    }

    // Disable the dropdown if no building is selected
    buildingPrioritySelect.disabled = !isBuildingSelected;
}

// Drop down for selecting priority setting for the currently selected building
document.querySelectorAll('.dropdown-item').forEach(item => {
  console.log('letsss gooooo')
  item.addEventListener('click', function(e) {
    e.preventDefault();
    const value = this.getAttribute('data-value');
    const text = this.textContent.trim();
    const locationId = selectedLocationId; // Ensure you have this variable available from your selection

    // Update button text and hidden input value
    document.getElementById('building-priority-dropdown').textContent = text;
    document.getElementById('hidden-input-for-priority').value = value;

    // Update UI and backend with the new value...
    updateLocationPrioritySymbol(locationId, value);
  });
});

function updateLocationPriority(locationId, newPriority) {
    // Assuming 'selectedLocationId' is a global variable that holds the ID of the currently selected location.

    fetch(`/data/update-building-priority/${locationId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken // Include CSRF token in your request header
        },
        body: JSON.stringify({ 'building_priority': newPriority })
    })
    .then(response => {
        console.log('response')
        console.log(response)
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Priority updated successfully!', data);
        // Store the new priority globally
        selectedBuildingPriority = newPriority;
        // Update the UI accordingly
        // Update the priority indicator for this location
        updatePriorityIndicator(locationId, newPriority);
        // renderLocations();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function updatePriorityIndicator(locationId, newPriority) {
    let priorityIndicator = document.getElementById('priority-indicator-' + locationId);
    if (!priorityIndicator) return; // Exit if the element is not found

    // Remove all possible classes for indicators
    priorityIndicator.className = 'priority-indicator'; // Reset the class list
    let icon = priorityIndicator.querySelector('i'); // Assuming there's always an <i> element inside
    icon.className = ''; // Reset icon classes

    // Apply new classes based on the new priority
    switch (parseInt(newPriority, 10)) {
        case 0:
            priorityIndicator.classList.add('bg-grey');
            priorityIndicator.title = 'None';
            break;
        case 1:
            priorityIndicator.classList.add('bg-green');
            icon.classList.add('bi', 'bi-check-circle-fill');
            priorityIndicator.title = 'Done';
            break;
        case 2:
            priorityIndicator.classList.add('bg-yellow');
            icon.classList.add('bi', 'bi-exclamation-circle-fill');
            priorityIndicator.title = 'Intermediate Priority';
            break;
        case 3:
            priorityIndicator.classList.add('bg-red');
            icon.classList.add('bi', 'bi-exclamation-triangle-fill');
            priorityIndicator.title = 'High Priority';
            break;
        default:
            priorityIndicator.classList.add('bg-grey');
            icon.classList.add('bi', 'bi-circle');
            priorityIndicator.title = 'Unknown';
            break;
    }
}


// When a location is selected...
function onLocationSelect(locationId) {
    // Enable the dropdown and button
    document.getElementById('building-priority-select').disabled = false;
    document.getElementById('update-priority-btn').disabled = false;
    // Set the dropdown value to the selected location's priority
    document.getElementById('building-priority-select').value = selectedLocationPriority.toString();
}


document.getElementById('search').addEventListener('input', renderLocations);

document.getElementById('previous').addEventListener('click', () => {
    if (currentFloorPlanIndex > 0) {
        currentFloorPlanIndex--;
        updateFloorPlan();
    }
});

document.getElementById('next').addEventListener('click', () => {
    if (currentFloorPlanIndex < floorPlans.length - 1) {
        currentFloorPlanIndex++;
        updateFloorPlan();
    }
});

function updateFloorNumber() {
    const floorNumberElement = document.getElementById('floor-number');

    if (floorPlans[currentFloorPlanIndex].floor === 0) {
        floorNumberElement.textContent = "Ground Floor";
    } else if (floorPlans[currentFloorPlanIndex].floor < 0) {
        floorNumberElement.textContent = "Basement " + Math.abs(floorPlans[currentFloorPlanIndex].floor);
    } else {
        floorNumberElement.textContent = "Floor " + floorPlans[currentFloorPlanIndex].floor;
    }
}



// Deselect room
function deselectRoom() {
    // update recently selected room to be null
    if (previouslySelectedRoom) {
        previouslySelectedRoom.setStyle({
            weight: 1,  // Restore previous border weight
            fillOpacity: 0.3 // Restore previous fill opacity
        });
        previouslySelectedRoom = null;  // Reset the previouslySelectedRoom
    }

    // Update
    selectedRoom = null;
    document.getElementById('room-info').classList.add('disabled');
    document.getElementById('room-info-message').style.display = 'block';
    document.getElementById('room-info').style.display = 'none';
}

// Save room details
function saveRoomDetails() {
    // Gather the updated details from the form
    console.log('getElementById check:')
    console.log(document.getElementById('room-name').value);
    roomDetails.room_name = document.getElementById('room-name').value;
    roomDetails.room_type = document.getElementById('room-type').value;
    roomDetails.workers_count = document.getElementById('workers-count').value;
    roomDetails.last_contacted = document.getElementById('last-contacted').value;
    roomDetails.follow_up_needed = document.getElementById('follow-up-needed').checked;
    roomDetails.notes = document.getElementById('notes').value;

    // Need to update the selectedRoom object as well
    console.log('selectedRoom properties')
    console.log(selectedRoom.feature.properties)
    selectedRoom.feature.properties.room_name = roomDetails.room_name;
    selectedRoom.feature.properties.room_type = roomDetails.room_type;
    selectedRoom.feature.properties.workers_count = roomDetails.workers_count;
    selectedRoom.feature.properties.last_contacted = roomDetails.last_contacted;
    selectedRoom.feature.properties.follow_up_needed = roomDetails.follow_up_needed;
    selectedRoom.feature.properties.notes = roomDetails.notes;

    fetch(`/data/locations/${selectedLocationId}/floorplans/${floorPlans[currentFloorPlanIndex].id}/rooms/${selectedRoom.feature.properties.id}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(roomDetails)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // console.log('Success:', data);
        // Update the room color
        feature = selectedRoom.feature
        geometry = selectedRoom.feature.geometry
        drawnItems.removeLayer(selectedRoom); // Remove the old layer
        let newLayer = createStyledRoomLayer(feature, geometry, onRoomSelected); // Create a new layer with updated style
        drawnItems.addLayer(newLayer); // Add the new layer to the map
        selectedRoom.feature = newLayer.feature; // Make the new layer the selected room

        // Disable the save button
        document.getElementById('save').disabled = true;
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}


// Function for the displaying of the room infobox
function toggleRoomInfo() {
    let roomInfo = document.getElementById('room-info');
    let roomInfoMessage = document.getElementById('room-info-message');
    let formElements = document.querySelectorAll('#room-info input, #room-info textarea, #room-info button, #room-info select');

    if (selectedRoom) {
        roomInfo.style.display = 'block';
        roomInfoMessage.style.display = 'none';
        formElements.forEach(element => element.disabled = false);  // Enable all form fields and buttons
    } else {
        roomInfo.style.display = 'none';
        roomInfoMessage.style.display = 'block';
        formElements.forEach(element => element.disabled = true);  // Disable all form fields and buttons
    }
}


// When a room is selected
function onRoomSelected(e) {
    if (e.target) {

        // If there was a previously selected room, revert its style
        if (previouslySelectedRoom) {
            previouslySelectedRoom.setStyle({
                weight: 1,  // Restore previous border weight
                fillOpacity: 0.3 // Restore previous fill opacity
            });
        }
        // Highlight the selected room
        e.target.setStyle({
            weight: 5,  // Make the border thicker
            fillOpacity: 0.7  // Make the fill more opaque
        });
        previouslySelectedRoom = e.target;  // Update the previouslySelectedRoom to the current one

        // Now update which room is selected
        selectedRoom = e.target;
        fetch(`/data/locations/${selectedLocationId}/floorplans/${floorPlans[currentFloorPlanIndex].id}/rooms/${selectedRoom.id}/`)
            .then(response => response.json())
            .then(data => {
                roomDetails = data.features[0].properties;
                toggleRoomInfo();
                populateRoomTypes(roomTypes); // Populate room types in room-types drop-down
                displayRoomDetails();
            });
    } else {
        console.error('Error: No target element found in onRoomSelected');
    }
}

// Display room details
function displayRoomDetails() {
    let formElements = document.querySelectorAll('#room-info input, #room-info textarea, #room-info button');
    formElements.forEach(element => element.disabled = false);  // Enable all form fields and buttons

    document.getElementById('room-info').classList.remove('disabled');
    document.getElementById('room-name').value = roomDetails.room_name;
    document.getElementById('room-type').value = roomDetails.room_type || '';
    document.getElementById('workers-count').value = roomDetails.workers_count || '';
    document.getElementById('last-contacted').value = roomDetails.last_contacted || '';
    document.getElementById('follow-up-needed').checked = roomDetails.follow_up_needed;
    document.getElementById('notes').value = roomDetails.notes;
}

function populateRoomTypes(roomTypes) {
  const roomTypeSelect = document.getElementById('room-type');
  // Clear options first
  roomTypeSelect.innerHTML = '';
  Object.entries(roomTypes).forEach(([key, value]) => {
    const option = document.createElement('option');
    option.value = key;
    option.text = value;
    roomTypeSelect.appendChild(option);
  });
}


// *****************************************
// Floor plans stuff below

function getFloorPlans(locationId) {
    fetch(`/data/locations/${locationId}/floorplans/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Sort floor plans by the 'floor' field
            data.sort((a, b) => a.floor - b.floor);
            // Set floorPlans to the fetched and sorted data
            floorPlans = data;
            currentFloorPlanIndex = 0;
            updateFloorPlan();
            // Fetch rooms
            return fetch(`/data/locations/${selectedLocationId}/floorplans/${floorPlans[currentFloorPlanIndex].id}/get_rooms/`);
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                data.features.forEach(feature => {
                    let geometry = feature.geometry;
                    let layer = L.geoJSON(geometry);
                    layer.feature = feature;  // Attach the feature data to the layer
                    drawnItems.addLayer(layer);
                    // Add click event listener to the polygon
                    layer.on('click', onRoomSelected);
                });
            })


            .catch(e => {
                console.log('There was a problem with your fetch operation: ' + e.message);
            });
}


function saveGeoJSON() {
    let geojson = drawnItems.toGeoJSON();
    let lastFeatureGeometry = geojson.features[geojson.features.length - 1].geometry;
    return fetch('/data/locations/' + selectedLocationId + '/floorplans/' + floorPlans[currentFloorPlanIndex].id + '/save_rooms/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken  // Replace with your CSRF token
        },
        body: JSON.stringify(lastFeatureGeometry)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        return data;
    })
    .catch((error) => {
        console.error('Error:', error);
        return null;
    });
}

function createStyledRoomLayer(roomFeature, geometry, onRoomSelectedCallback) {
    let layerColor;
    if (roomFeature.properties.follow_up_needed) {
        layerColor = 'orange'; // follow-up is needed
    } else if (roomFeature.properties.last_contacted) {
        layerColor = 'green'; // no follow-up is needed, and there's a date
    } else {
        layerColor = 'blue'; // no follow-up is needed, but no date
    }

    let layer = L.geoJSON(geometry, {
        style: function() {
            return { color: layerColor, weight: 1, fillColor: layerColor, fillOpacity: 0.3 };
        }
    });

    layer.feature = roomFeature;  // Attach the feature data to the layer
    layer.id = roomFeature.properties.id; // Attach the room id to the layer
    layer.on('click', function(e) {
        L.DomEvent.stopPropagation(e); // Prevents the event from bubbling up
        onRoomSelectedCallback(e);
    });

    return layer;
}
function updateFloorPlan() {
    const floorPlanContainer = document.querySelector('.floor-plan-container');
    floorPlanContainer.innerHTML = '';  // Clear previous floor plan

    if (floorPlans.length > 0 && currentFloorPlanIndex >= 0) {
        updateFloorNumber();  // Update the displayed floor number
        let floorPlan = floorPlans[currentFloorPlanIndex];
        document.getElementById('floor-name').textContent = currentLocationName;

        // Create a new div for the Leaflet map
        const mapDiv = document.createElement('div');
        mapDiv.id = 'map';
        mapDiv.style.height = "500px";  // Or set to a height of your choosing
        mapDiv.style.width = "100%";

        // Add the new div to the DOM
        floorPlanContainer.appendChild(mapDiv);

        // Remove the old map and initialize the Leaflet map with L.CRS.Simple and minZoom
        if (map) {
            map.remove();
        }
        map = L.map('map', {
            crs: L.CRS.Simple,
            minZoom: -1
        }).setView([0, 0], 0);

        // Clear the drawnItems Feature Group
        drawnItems.clearLayers();

        // Add the cleared Feature Group to the map
        drawnItems.addTo(map);

        // Use JavaScript Image object to get the dimensions of the floorplan image
        let img = new Image();
        img.src = "/media/" + floorPlan.image;
        img.onload = function() {
        // Define the corners of the image based on its dimensions
        const imageBounds = [[0, 0], [this.height, this.width]];

        // Add the image overlay to the map
        let image = L.imageOverlay(img.src, imageBounds).addTo(map);
        map.fitBounds(image.getBounds());

        // Fetch all the rooms geometry and add it to the map
        fetch(`/data/locations/${selectedLocationId}/floorplans/${floorPlans[currentFloorPlanIndex].id}/get_rooms/`)
            .then(response => response.json())
            .then(data => {
                data.features.forEach(feature => {
                  let geometry = feature.geometry;
                  let layer = createStyledRoomLayer(feature, geometry, onRoomSelected);
                  selectedRoom = layer;  // Store the created layer in selectedRoom
                  drawnItems.addLayer(layer);
              });
        });


        map.on('click', function(e) {
            deselectRoom();
        });

        // event listeners for draw:created and draw:edited
        map.on('draw:created', function (e) {
            let layer = e.layer;
            drawnItems.addLayer(layer);
            saveGeoJSON().then(response => {
                let room = response.room;
                if (room) {
                    layer.feature = {
                        type: 'Feature',
                        properties: room,
                        geometry: layer.toGeoJSON().geometry
                    };
                    room.id = room.fields.id
                    layer.id = room.id;
                    // Here, we immediately set selectedRoom to be the newly created room.
                    selectedRoom = room;
                    layer.on('click', function(e) {
                        L.DomEvent.stopPropagation(e);
                        onRoomSelected(e);
                    });
                }
            });
        });

        map.on('draw:edited', function (e) {
                saveGeoJSON();
            });
        };

        // Set up Leaflet.draw
        const drawControl = new L.Control.Draw({
            draw: {
                polyline: false,
                circle: false,
                marker: false,
                circlemarker: false,
                rectangle: false,
                polygon: {
                    allowIntersection: false, // Disallows polygons from intersecting
                }
            },
            edit: {
                featureGroup: drawnItems, //REQUIRED!!
                remove: false
            }
        });

        map.addControl(drawControl);

        // Change tooltip to be me obvious to the user
        let drawPolygonButton = document.querySelector('.leaflet-draw-draw-polygon');
        drawPolygonButton.title = 'Draw a room';

        // Make sure the map stretches to fit the div
        map.invalidateSize();


    } else {
        document.getElementById('floor-name').textContent = '';
    }
}


// Call this function after the DOM is loaded
function addEventListenersToElements() {
    // Update room details when the save button is clicked
    document.getElementById('save').addEventListener('click', function() {
        if (selectedRoom) {
            roomDetails.name = document.getElementById('room-name').value;
            roomDetails.roomType = document.getElementById('room-type').value;
            roomDetails.workersCount = document.getElementById('workers-count').value;
            roomDetails.lastContacted = document.getElementById('last-contacted').value;
            roomDetails.followUpNeeded = document.getElementById('follow-up-needed').value;
            roomDetails.notes = document.getElementById('notes').value;
            saveRoomDetails();
        }
    });

    // Enable save button on any input change
    let inputFields = ['room-name', 'room-type', 'workers-count', 'last-contacted', 'follow-up-needed', 'notes'];
    inputFields.forEach(fieldId => {
        document.getElementById(fieldId).addEventListener('input', function() {
            document.getElementById('save').disabled = false;
            toggleRoomInfo();
        });
    });

    // Deselect room when the cancel button is clicked
    document.getElementById('cancel').addEventListener('click', function() {
        deselectRoom();
        toggleRoomInfo();
    });

    // Handle delete button functionality:
    const confirmButton = document.getElementById('confirmDeleteButton');
    confirmButton.onclick = function () {
      const roomId = selectedRoom.id;
      const locationId = selectedLocationId;
      const floorplanId = floorPlans[currentFloorPlanIndex].id;
      // Send a DELETE request
      fetch(`/data/locations/${locationId}/floorplans/${floorplanId}/rooms/${roomId}/`, {
          method: 'DELETE',
      })
      .then((response) => response.json())
      .then((data) => {
          if (data.status === 'success') {
              // Successfully deleted
              // Refresh the list or remove the deleted item from the DOM
          } else {
              // Handle error
          }
      });

      $('#confirmDeleteModal').modal('hide'); // Close the modal (Bootstrap 3.4.1)
      deleteRoomById(roomId); // Update floor plan after room is deleted (want the user to see that the room is now deleted!)
  };
}

// Function to delete a room polygon, given a room's id
function deleteRoomById(roomId) {
    drawnItems.eachLayer(function (layer) {
        if (layer.id === roomId) {
            drawnItems.removeLayer(layer);
        }
    });
}

// Load room types for the "Room types" drop-down box
function getRoomTypes() {
  return fetch('/data/room_types/')
    .then(response => response.json())
    .catch(error => console.error('Error:', error));
}

window.onload = function() {
    getLocations();
    addEventListenersToElements();
    getRoomTypes().then(data => {
        roomTypes = data;
    });
};
