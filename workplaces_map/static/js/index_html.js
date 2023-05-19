// Javascript for index.html (website home-page)

let floorPlans = [];
let currentFloorPlanIndex = -1;  // Initialize to -1
let currentLocationName = '';  // Initialize to an empty string
let selectedLocationId = null;
let locations = [];
let drawnItems = L.featureGroup(); // Initialize drawnItems as an empty Leaflet Feature Group
let map;
let selectedRoom = null;
let roomDetails = {};

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
            locations = data;
            renderLocations();
        });
}

function renderLocations() {
    let list = document.getElementById('location-list');
    list.innerHTML = '';
    let searchValue = document.getElementById('search').value.toLowerCase();

    locations.forEach((location, index) => {
        if (location.name.toLowerCase().includes(searchValue)) {
            let item = document.createElement('li');
            item.textContent = location.name;
            item.classList.add('list-group-item', 'list-group-item-action');

            // If this location is the selected one, add the 'active' class
            if (location.id === selectedLocationId) {  // Add this line
                item.classList.add('active');  // Add this line
            }  // Add this line

            item.addEventListener('click', () => {
            // Remove 'active' class from previously selected item, if there is one
            let previousSelectedItem = document.querySelector('.list-group-item.active');
            if (previousSelectedItem) {
                previousSelectedItem.classList.remove('active');
            }

            // Add 'active' class to the clicked item
            item.classList.add('active');

            // Store the location's ID
            selectedLocationId = location.id;  // Add this line

            // Call getFloorPlans() after the selectedLocationId is set
            getFloorPlans(location.id);
            currentLocationName = location.name;  // Store the location name
            currentFloorPlanIndex = 0;  // Set to 0 when a location is clicked
        });


            list.appendChild(item);
        }
    });
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

// Deselect room
function deselectRoom() {
    selectedRoom = null;
    document.getElementById('room-info').classList.add('disabled');
    document.getElementById('room-info-message').style.display = 'block';
    document.getElementById('room-info').style.display = 'none';
}

// Save room details
function saveRoomDetails() {
    // Gather the updated details from the form
    roomDetails.room_name = document.getElementById('room-name').value;
    roomDetails.workers_count = document.getElementById('workers-count').value;
    roomDetails.last_contacted = document.getElementById('last-contacted').value;
    roomDetails.follow_up_needed = document.getElementById('follow-up-needed').checked;
    roomDetails.notes = document.getElementById('notes').value;

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
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}



// Function for the displaying of the room infobox
function toggleRoomInfo() {
    let roomInfo = document.getElementById('room-info');
    let roomInfoMessage = document.getElementById('room-info-message');
    let formElements = document.querySelectorAll('#room-info input, #room-info textarea, #room-info button');

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
        selectedRoom = e.target;
        fetch(`/data/locations/${selectedLocationId}/floorplans/${floorPlans[currentFloorPlanIndex].id}/rooms/${selectedRoom.id}/`)
            .then(response => response.json())
            .then(data => {
                roomDetails = data.features[0].properties;  // Update this line
                toggleRoomInfo();
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
    document.getElementById('workers-count').value = roomDetails.workers_count || '';
    document.getElementById('last-contacted').value = roomDetails.last_contacted || '';
    document.getElementById('follow-up-needed').checked = roomDetails.follow_up_needed;
    document.getElementById('notes').value = roomDetails.notes;
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



function updateFloorPlan() {
    const floorPlanContainer = document.querySelector('.floor-plan-container');
    floorPlanContainer.innerHTML = '';  // Clear previous floor plan

    if (floorPlans.length > 0 && currentFloorPlanIndex >= 0) {
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
                let layer = L.geoJSON(geometry);
                layer.feature = feature;  // Attach the feature data to the layer
                layer.id = feature.properties.id; // Attach the room id to the layer
                layer.on('click', function(e) {
                    L.DomEvent.stopPropagation(e); // Prevents the event from bubbling up
                    onRoomSelected(e);
                });
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
                let room = response.room;  // Changed this line
                if (room) {
                    layer.feature = {
                        type: 'Feature',
                        properties: room,
                        geometry: layer.toGeoJSON().geometry
                    };
                    layer.id = room.pk; // Attach the room id to the layer
                    layer.on('click', function(e) {
                        L.DomEvent.stopPropagation(e); // Prevents the event from bubbling up
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

        // // Make sure the current room will be de-selected when user clicks outside room polygons
        // map.on('click', function(e) {
        //     if (!e.originalEvent._stopped) { // This means the click was not on a room (polygon)
        //         deselectRoom(); // Call your deselect function
        //     }
        // });


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
            roomDetails.workersCount = document.getElementById('workers-count').value;
            roomDetails.lastContacted = document.getElementById('last-contacted').value;
            roomDetails.followUpNeeded = document.getElementById('follow-up-needed').value;
            roomDetails.notes = document.getElementById('notes').value;
            saveRoomDetails();
        }
    });

    // Deselect room when the cancel button is clicked
    document.getElementById('cancel').addEventListener('click', function() {
        deselectRoom();
        toggleRoomInfo();
    });
}

window.onload = function() {
    getLocations();
    addEventListenersToElements();
};
