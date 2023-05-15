// Javascript for index.html (website home-page)

let floorPlans = [];
let currentFloorPlanIndex = -1;  // Initialize to -1
let currentLocationName = '';  // Initialize to an empty string
let selectedLocationId = null;
let locations = [];
let drawnItems = L.featureGroup(); // Initialize drawnItems as an empty Leaflet Feature Group

// *****************************************
// Get building locations and render them in the list
function getLocations() {
    fetch('/data/locations/')
        .then(response => response.json())
        .then(data => {
            locations = data;
            renderLocations();
        })
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

                getFloorPlans(location.id);
                currentLocationName = location.name;  // Store the location name
                currentFloorPlanIndex = 0;  // Set to 0 when a location is clicked

                // Store the location's ID
                selectedLocationId = location.id;  // Add this line
            });

            list.appendChild(item);
        }
    });
}

document.getElementById('search').addEventListener('input', renderLocations);


// *****************************************
// Floor plans stuff below
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

function getFloorPlans(locationId) {
    fetch(`/data/locations/${locationId}/floorplans/`)
        .then(response => response.json())
        .then(data => {
            // Sort floor plans by the 'floor' field
            data.sort((a, b) => a.floor - b.floor);
            // Set floorPlans to the fetched and sorted data
            floorPlans = data;
            currentFloorPlanIndex = 0;
            updateFloorPlan();
        })
}

function saveGeoJSON() {
    let geojson = drawnItems.toGeoJSON();
    fetch('/data/locations/' + selectedLocationId + '/floorplans/' + floorPlans[currentFloorPlanIndex].id + '/save_rooms/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken  // Replace with your CSRF token
        },
        body: JSON.stringify(geojson)
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

        // Initialize the Leaflet map with L.CRS.Simple and minZoom
        const map = L.map('map', {
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

            // Fetch the rooms' geometry and add it to the map
            fetch(`/data/locations/${selectedLocationId}/floorplans/${floorPlans[currentFloorPlanIndex].id}/get_rooms/`)
                .then(response => response.json())
                .then(data => {
                    data.forEach(room => {
                        room.geometry.features.forEach(feature => {
                            let geometry = feature.geometry;
                            let layer = L.GeoJSON.geometryToLayer(geometry);
                            drawnItems.addLayer(layer);
                        });
                    });
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

        // event listeners for draw:created and draw:edited
        map.on('draw:created', function (e) {
          let layer = e.layer;
          drawnItems.addLayer(layer);
          saveGeoJSON();
        });

        map.on('draw:edited', function (e) {
          saveGeoJSON();
        });

    } else {
        document.getElementById('floor-name').textContent = '';
    }
}


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

getLocations();