(function () {
  function initMap() {
    const mapNode = document.getElementById("store-map");
    if (!mapNode || typeof L === "undefined") return;

    const coords = [55.751244, 37.618423];
    const map = L.map(mapNode, { attributionControl: false }).setView(coords, 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "",
    }).addTo(map);

    L.marker(coords)
      .addTo(map)
      .bindPopup("<strong>BuildCore</strong><br>ул. Технопарковая, 7")
      .openPopup();
  }

  document.addEventListener("DOMContentLoaded", initMap);
})();
