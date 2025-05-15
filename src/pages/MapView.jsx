import { useEffect, useRef } from 'react';
// import { getAllReports } from '@/services/reportService';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import 'leaflet/dist/leaflet.css';
// Import your GeoJSON data (now as .js)
import { biodiversityHotspotsData } from '@/data/biodiversityHotspots'; // Adjust path if needed
import * as turf from '@turf/turf'; // Import turf

const MAP_CENTER = [20.5937, 78.9629];
const INITIAL_ZOOM = 5;
const POLLUTION_THRESHOLD = 10;
const HOT_HOTSPOT_COLOR = '#A50026'; // A deep, dark red
const HOT_HOTSPOT_OPACITY = 0.7;

const MapView = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapRef.current).setView(MAP_CENTER, INITIAL_ZOOM);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      const reports = getAllReports();

      const processedHotspotsData = JSON.parse(JSON.stringify(biodiversityHotspotsData));

      if (processedHotspotsData.type === "FeatureCollection") {
        processedHotspotsData.features.forEach((hotspotFeature) => {
          let count = 0;
          if (hotspotFeature.geometry) {
            reports.forEach(report => {
              const reportPoint = turf.point([report.longitude, report.latitude]);
              if (turf.booleanPointInPolygon(reportPoint, hotspotFeature)) {
                count++;
              }
            });
          }
          if (!hotspotFeature.properties) {
            hotspotFeature.properties = { name: 'Unknown', description: '' };
          }
          hotspotFeature.properties.reportCount = count;
        });
      }

      const hotspotStyle = (feature) => {
        let fillColor = '#CCCCCC';
        let specificFillOpacity = 0.5;

        if (feature && feature.properties) {
          if (feature.properties.reportCount && feature.properties.reportCount >= POLLUTION_THRESHOLD) {
            fillColor = HOT_HOTSPOT_COLOR;
            specificFillOpacity = HOT_HOTSPOT_OPACITY;
          } else {
            switch (feature.properties.name) {
              case 'The Himalayas':
                fillColor = '#008000';
                break;
              case 'Western Ghats':
                fillColor = '#FFFF00';
                break;
              case 'Indo-Burma Region (Indian Part)':
                fillColor = '#FF0000';
                specificFillOpacity = 0.45;
                break;
              case 'Sundaland (Andaman & Nicobar Islands)':
                fillColor = '#C71585';
                break;
              default:
                fillColor = '#90EE90';
                specificFillOpacity = 0.4;
            }
          }
        }

        return {
          fillColor: fillColor,
          weight: 2,
          opacity: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: specificFillOpacity,
        };
      };

      const onEachHotspotFeature = (feature, layer) => {
        if (feature.properties && feature.properties.name) {
          let popupContent = `<h4 style="font-weight: bold; margin-bottom: 5px;">${feature.properties.name}</h4>`;
          if (feature.properties.description) {
            popupContent += `<p style="font-size: 0.9em;">${feature.properties.description}</p>`;
          }
          if (typeof feature.properties.reportCount === 'number') {
            popupContent += `<p style="font-size: 0.9em; margin-top: 5px;">Pollution Reports: <strong>${feature.properties.reportCount}</strong></p>`;
          }
          layer.bindPopup(popupContent);

          layer.bindTooltip(`${feature.properties.name} (Reports: ${feature.properties.reportCount || 0})`, {
            permanent: false,
            direction: 'auto'
          });
        }
      };

      const hotspotsLayer = L.geoJSON(processedHotspotsData, {
        style: hotspotStyle,
        onEachFeature: onEachHotspotFeature
      }).addTo(map);

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="marker-pin bg-ecochain-green-500"></div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });

      reports.forEach(report => {
        const marker = L.marker([report.latitude, report.longitude], {
          icon: customIcon
        }).addTo(map);
        const popupContent = `
          <div class="popup-content">
            <h3 class="font-bold">${report.type}</h3>
            <p class="text-sm">${report.description}</p>
            <p class="text-xs mt-2">Status: ${report.status}</p>
            <p class="text-xs">Reported by: ${report.submittedBy}</p>
          </div>
        `;
        marker.bindPopup(popupContent);
      });

      toast({
        title: "Map Loaded",
        description: `Displaying ${reports.length} pollution reports and biodiversity hotspots.`,
      });
    }).catch(error => {
      console.error("Error loading Leaflet or processing map data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load or process map data. Please try again later.",
      });
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [toast]);

  const hotspotLegendColors = [
    '#008000',
    '#FFFF00',
    '#FF0000',
    '#C71585',
  ];

  return (
    <div className="py-6 px-6 md:px-12 bg-gradient-to-br from-[#101c1a] via-[#1a2e2b] to-[#0e1a17] dark min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-white/5 dark:bg-black/30 backdrop-blur-2xl z-0 pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10 animate-fade-in animate-delay-100">
        <h1 className="text-3xl font-bold mb-6 text-white drop-shadow-lg">Pollution Map</h1>
        <Card className="mb-8 overflow-hidden glass saas-shadow bg-white/5 border-white/10 animate-slide-up animate-delay-200">
          <CardContent className="p-0">
            <div ref={mapRef} className="h-[70vh] w-full rounded-2xl overflow-hidden" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="col-span-full mb-2">
            <h2 className="text-xl font-bold text-ecochain-green-200 mb-2">
              Biodiversity Hotspots
              <span className="text-sm font-normal text-gray-400 ml-2">
                (Regions turn <span style={{color: HOT_HOTSPOT_COLOR, fontWeight: 'bold'}}>dark red</span> if pollution reports ≥ {POLLUTION_THRESHOLD})
              </span>
            </h2>
          </div>
          {biodiversityHotspotsData.features.map((feature, idx) => (
            <Card key={feature.properties.name} className="glass saas-shadow bg-white/5 border-white/10 animate-slide-up" style={{animationDelay: `${300 + idx * 100}ms`}}>
              <CardContent className="p-6">
                <div className="flex items-center mb-2">
                  <span className="w-4 h-4 rounded-full mr-2" style={{backgroundColor: hotspotLegendColors[idx % hotspotLegendColors.length] || '#CCCCCC'}} />
                  <h3 className="text-lg font-semibold text-ecochain-green-200">{feature.properties.name}</h3>
                </div>
                <p className="text-sm text-gray-300">{feature.properties.description}</p>
              </CardContent>
            </Card>
          ))}
          <div className="col-span-full mt-6 mb-2">
            <h2 className="text-xl font-bold text-ecochain-green-200 mb-2">Pollution Types</h2>
          </div>
          <Card className="glass saas-shadow bg-white/5 border-white/10 animate-slide-up animate-delay-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-ecochain-green-200">Air Pollution</h3>
              <p className="text-sm text-gray-300">Includes reports of smoke, factory emissions, and other air quality concerns.</p>
            </CardContent>
          </Card>
          <Card className="glass saas-shadow bg-white/5 border-white/10 animate-slide-up animate-delay-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-ecochain-green-200">Water Pollution</h3>
              <p className="text-sm text-gray-300">Includes reports of contaminated water bodies, industrial discharge, and sewage issues.</p>
            </CardContent>
          </Card>
          <Card className="glass saas-shadow bg-white/5 border-white/10 animate-slide-up animate-delay-900">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-ecochain-green-200">Waste Dumping</h3>
              <p className="text-sm text-gray-300">Includes reports of illegal waste disposal, garbage accumulation, and plastic pollution.</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <style>{`
        .animate-delay-100 { animation-delay: 100ms; }
        .animate-delay-200 { animation-delay: 200ms; }
        .animate-delay-300 { animation-delay: 300ms; }
        .animate-delay-400 { animation-delay: 400ms; }
        .animate-delay-500 { animation-delay: 500ms; }
        .animate-delay-700 { animation-delay: 700ms; }
        .animate-delay-800 { animation-delay: 800ms; }
        .animate-delay-900 { animation-delay: 900ms; }
        .marker-pin {
          width: 20px;
          height: 20px;
          border-radius: 50% 50% 50% 0;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -21px 0 0 -10px;
        }
        .leaflet-popup-content h4 {
          margin-top: 0;
          margin-bottom: 5px;
          color: #333;
        }
        .leaflet-popup-content p {
          margin: 0;
          color: #555;
        }
      `}</style>
    </div>
  );
};

export default MapView;
