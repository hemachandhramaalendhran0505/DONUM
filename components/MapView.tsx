
import React, { useEffect, useRef, useState } from 'react';
import { DonationItem, GeoLocation, NGO, Requester } from '../types';
import { MapPin, Navigation, Loader2, AlertCircle, X, Clock, Map as MapIcon, User, ToggleLeft, Layers, Palette, Bike, Filter, Target } from 'lucide-react';

declare var google: any;

interface MapViewProps {
  donations: DonationItem[];
  activeDelivery?: DonationItem | null;
  ngos?: NGO[];
  requesters?: Requester[];
}

const mapStyles: Record<string, any[]> = {
  default: [],
  silver: [
    {
      elementType: "geometry",
      stylers: [{ color: "#f5f5f5" }],
    },
    {
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#616161" }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#f5f5f5" }],
    },
    {
      featureType: "administrative.land_parcel",
      elementType: "labels.text.fill",
      stylers: [{ color: "#bdbdbd" }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#eeeeee" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#757575" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#e5e5e5" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9e9e9e" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }],
    },
    {
      featureType: "road.arterial",
      elementType: "labels.text.fill",
      stylers: [{ color: "#757575" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#dadada" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#616161" }],
    },
    {
      featureType: "road.local",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9e9e9e" }],
    },
    {
      featureType: "transit.line",
      elementType: "geometry",
      stylers: [{ color: "#e5e5e5" }],
    },
    {
      featureType: "transit.station",
      elementType: "geometry",
      stylers: [{ color: "#eeeeee" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#c9c9c9" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9e9e9e" }],
    },
  ],
  night: [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#242f3e" }],
    },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ],
  retro: [
    { elementType: "geometry", stylers: [{ color: "#ebe3cd" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#523735" }] },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#f5f1e6" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#f5f1e6" }],
    }
  ]
};

const MapView: React.FC<MapViewProps> = ({ donations, activeDelivery, ngos = [], requesters = [] }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const bikeMarkerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [userLocation, setUserLocation] = useState<GeoLocation | null>(null);
  const [mapError, setMapError] = useState(false); 
  const [isLocating, setIsLocating] = useState(true);
  
  const [currentStyle, setCurrentStyle] = useState('retro');

  // Range filter state (in km)
  const [rangeFilter, setRangeFilter] = useState<number>(10);
  
  // Toggle visibility of different entity types
  const [showDonations, setShowDonations] = useState(true);
  const [showNGOs, setShowNGOs] = useState(true);
  const [showRequesters, setShowRequesters] = useState(true);
  
  // Selected entity for info panel
  const [selectedEntity, setSelectedEntity] = useState<{type: 'donation' | 'ngo' | 'requester', data: any} | null>(null);

  const [selectedDonation, setSelectedDonation] = useState<DonationItem | null>(null);
  const [routeStats, setRouteStats] = useState<{ distance: string, duration: string, eta: string, legs?: any[] } | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (loc1: GeoLocation, loc2: GeoLocation): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter entities by range
  const filterByRange = <T extends {geoLocation: GeoLocation}>(entities: T[]): T[] => {
    if (!userLocation) return entities;
    return entities.filter(entity => {
      const distance = calculateDistance(userLocation, entity.geoLocation);
      return distance <= rangeFilter;
    });
  };

  // Get urgency weight for sorting
  const getUrgencyWeight = (urgency: string): number => {
    switch(urgency) {
      case 'Critical': return 4;
      case 'High': return 3;
      case 'Medium': return 2;
      case 'Low': return 1;
      default: return 0;
    }
  };

  // Filter and sort donations by urgency within range
  const filteredDonations = donations
    .filter(d => d.status !== 'Delivered' && d.geoLocation)
    .filter(d => !userLocation || calculateDistance(userLocation, d.geoLocation) <= rangeFilter)
    .sort((a, b) => getUrgencyWeight(b.urgency) - getUrgencyWeight(a.urgency));

  // Filter NGOs within range
  const filteredNGOs = ngos
    .filter(n => n.geoLocation)
    .filter(n => !userLocation || calculateDistance(userLocation, n.geoLocation) <= rangeFilter);

  // Filter and sort requesters by urgency within range
  const filteredRequesters = requesters
    .filter(r => r.status === 'Active' && r.geoLocation)
    .filter(r => !userLocation || calculateDistance(userLocation, r.geoLocation) <= rangeFilter)
    .sort((a, b) => getUrgencyWeight(b.urgency) - getUrgencyWeight(a.urgency));

  useEffect(() => {
      if (activeDelivery) {
          setSelectedDonation(activeDelivery);
          // Auto-trigger route calc for automation
          if (!routeStats) setIsRouting(true); // Flag to trigger calc in effect below
          if (!userLocation && mapError) {
              setUserLocation({ lat: 12.9716, lng: 77.5946, address: "Mock Location" });
          }
      }
  }, [activeDelivery, mapError]);

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStyle = e.target.value;
      setCurrentStyle(newStyle);
      if (mapInstanceRef.current && mapStyles[newStyle]) {
          mapInstanceRef.current.setOptions({ styles: mapStyles[newStyle] });
      }
  };

  useEffect(() => {
    if ((window as any).gm_authFailure) {
        setMapError(true);
    }
    (window as any).gm_authFailure = () => {
        console.warn("Google Maps Auth Failure (Runtime) - Switching to Simulation Mode");
        setMapError(true);
        setIsLocating(false);
        setUserLocation((prev) => prev || { lat: 12.9716, lng: 77.5946 });
    };

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      setIsLocating(false);
      if(!userLocation) setUserLocation({ lat: 12.9716, lng: 77.5946 }); 
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        setUserLocation(newPos);
        setIsLocating(false);
        
        if (mapInstanceRef.current && userMarkerRef.current && !mapError) {
            try {
                const latLng = new google.maps.LatLng(newPos.lat, newPos.lng);
                userMarkerRef.current.setPosition(latLng);
            } catch (e) { }
        }
      },
      (error) => {
        let errorMsg = "Unknown Error";
        switch(error.code) {
            case 1: errorMsg = "Permission Denied"; break;
            case 2: errorMsg = "Position Unavailable"; break;
            case 3: errorMsg = "Timeout"; break;
        }
        console.warn(`Geolocation Error: ${errorMsg} (${error.message})`);
        setIsLocating(false);
        if(!userLocation) setUserLocation({ lat: 12.9716, lng: 77.5946, address: "Default Location" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [mapError]);

  // Init Map
  useEffect(() => {
    if (mapError) return;

    const initMap = async () => {
        if (!mapContainerRef.current) return;
        
        const timeoutId = setTimeout(() => {
             if (typeof google === 'undefined' || !google.maps) {
                 console.warn("Google Maps load timeout. Switching to Mock.");
                 setMapError(true);
             }
        }, 5000);

        if (typeof google === 'undefined') {
             return; 
        }

        clearTimeout(timeoutId);

        try {
            const { Map } = await google.maps.importLibrary("maps");
            const { Marker } = await google.maps.importLibrary("marker");
            const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes");

            const defaultCenter = userLocation || { lat: 12.9716, lng: 77.5946 }; 

            const map = new Map(mapContainerRef.current, {
                center: defaultCenter,
                zoom: 14,
                mapId: "DEMO_MAP_ID",
                mapTypeControl: false,
                fullscreenControl: false,
                streetViewControl: false,
                zoomControl: true,
                styles: mapStyles[currentStyle] || []
            });
            
            mapInstanceRef.current = map;

            directionsServiceRef.current = new DirectionsService();
            directionsRendererRef.current = new DirectionsRenderer({
                map: map,
                suppressMarkers: false, 
                polylineOptions: {
                    strokeColor: "#4285F4",
                    strokeWeight: 6,
                    strokeOpacity: 0.8
                }
            });

            const userMarker = new Marker({
                position: defaultCenter,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "white",
                },
                title: "You are here",
                zIndex: 999
            });
            userMarkerRef.current = userMarker;

            if (userLocation) {
                map.setCenter(userLocation);
            }

        } catch (e) {
            console.error("Map Init Error (Billing/API issue)", e);
            setMapError(true);
        }
    };

    initMap();
  }, [mapError]);

  // Update Markers
  useEffect(() => {
      if (mapError) return;

      const updateMarkers = async () => {
        if (!mapInstanceRef.current || typeof google === 'undefined') return;
        
        try {
            const { Marker } = await google.maps.importLibrary("marker");

            markersRef.current.forEach(marker => marker.setMap(null));
            markersRef.current = [];

            // Add Donation Markers
            if (showDonations) {
                donations.forEach((donation) => {
                    let position = donation.geoLocation;
                    if (!position) {
                        const centerLat = userLocation?.lat || 12.9716;
                        const centerLng = userLocation?.lng || 77.5946;
                        const idNum = donation.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        position = { 
                            lat: centerLat + ((idNum % 20) - 10) * 0.003,
                            lng: centerLng + ((idNum % 20) - 10) * 0.003
                        };
                    }

                    // Check if within range
                    if (userLocation && calculateDistance(userLocation, position) > rangeFilter) return;

                    const marker = new Marker({
                        position: position,
                        map: mapInstanceRef.current,
                        title: donation.title,
                        animation: google.maps.Animation.DROP,
                        label: donation.status === 'Matched' ? "M" : null,
                        icon: {
                            url: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
                        }
                    });

                    marker.addListener("click", () => {
                        setSelectedDonation(donation);
                        setRouteStats(null); 
                        directionsRendererRef.current?.setDirections({ routes: [] }); 
                        if(bikeMarkerRef.current) bikeMarkerRef.current.setMap(null);
                    });

                    markersRef.current.push(marker);

                    if (selectedDonation && selectedDonation.id === donation.id && selectedDonation.receiverLocation) {
                        const dropoffMarker = new Marker({
                            position: selectedDonation.receiverLocation,
                            map: mapInstanceRef.current,
                            title: "Dropoff Location",
                            icon: {
                                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                            }
                        });
                        markersRef.current.push(dropoffMarker);
                    }
                });
            }

            // Add NGO Markers
            if (showNGOs) {
                ngos.forEach((ngo) => {
                    if (!ngo.geoLocation) return;
                    
                    // Check if within range
                    if (userLocation && calculateDistance(userLocation, ngo.geoLocation) > rangeFilter) return;

                    const marker = new Marker({
                        position: ngo.geoLocation,
                        map: mapInstanceRef.current,
                        title: ngo.name,
                        animation: google.maps.Animation.DROP,
                        icon: {
                            url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                        }
                    });

                    marker.addListener("click", () => {
                        setSelectedEntity({type: 'ngo', data: ngo});
                    });

                    markersRef.current.push(marker);
                });
            }

            // Add Requester Markers
            if (showRequesters) {
                requesters.forEach((requester) => {
                    if (!requester.geoLocation || requester.status !== 'Active') return;
                    
                    // Check if within range
                    if (userLocation && calculateDistance(userLocation, requester.geoLocation) > rangeFilter) return;

                    // Color based on urgency
                    let iconUrl = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
                    if (requester.urgency === 'High') iconUrl = "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
                    else if (requester.urgency === 'Medium') iconUrl = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
                    else if (requester.urgency === 'Low') iconUrl = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";

                    const marker = new Marker({
                        position: requester.geoLocation,
                        map: mapInstanceRef.current,
                        title: requester.name,
                        animation: google.maps.Animation.BOUNCE,
                        icon: {
                            url: iconUrl
                        }
                    });

                    marker.addListener("click", () => {
                        setSelectedEntity({type: 'requester', data: requester});
                    });

                    markersRef.current.push(marker);
                });
            }
        } catch (e) {
            console.warn("Marker update failed", e);
        }
      };

      updateMarkers();
  }, [donations, ngos, requesters, userLocation, selectedDonation, mapError, rangeFilter, showDonations, showNGOs, showRequesters]);

  // Auto-Route Calc Effect
  useEffect(() => {
      if ((isRouting || activeDelivery) && (userLocation || mapError) && !routeStats && selectedDonation) {
          calculateRoute();
      }
  }, [isRouting, activeDelivery, userLocation, mapError, selectedDonation]);

  const animateBike = (route: any) => {
     if (!mapInstanceRef.current || typeof google === 'undefined') return;
     
     // Remove existing bike
     if (bikeMarkerRef.current) bikeMarkerRef.current.setMap(null);
     if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

     // Create detailed path
     let path: any[] = [];
     if (route.overview_path) {
         path = route.overview_path;
     } else {
         // Fallback
         path = [
             new google.maps.LatLng(userLocation?.lat, userLocation?.lng),
             new google.maps.LatLng(selectedDonation?.geoLocation?.lat, selectedDonation?.geoLocation?.lng)
         ];
     }

     // Create Bike Marker
     const bikeMarker = new google.maps.Marker({
         position: path[0],
         map: mapInstanceRef.current,
         icon: {
             url: "https://maps.google.com/mapfiles/kml/shapes/motorcycling.png", // Bike Icon
             scaledSize: new google.maps.Size(32, 32),
             anchor: new google.maps.Point(16, 16)
         },
         title: "Live Volunteer",
         zIndex: 1000
     });
     bikeMarkerRef.current = bikeMarker;

     let step = 0;
     const numSteps = 500; // Total animation frames for one full path traversal
     let pathIndex = 0;

     const animate = () => {
         step += 1;
         if (step > numSteps) {
             step = 0; // Loop or stop
         }
         
         // Calculate current position along the path (Simplified linear interpolation for demo)
         const totalPoints = path.length;
         const pointIndexFloat = (step / numSteps) * (totalPoints - 1);
         const index = Math.floor(pointIndexFloat);
         const nextIndex = Math.min(index + 1, totalPoints - 1);
         const percent = pointIndexFloat - index;
         
         const p1 = path[index];
         const p2 = path[nextIndex];
         
         if (p1 && p2 && typeof google !== 'undefined') {
             const lat = p1.lat() + (p2.lat() - p1.lat()) * percent;
             const lng = p1.lng() + (p2.lng() - p1.lng()) * percent;
             const newPos = new google.maps.LatLng(lat, lng);
             bikeMarker.setPosition(newPos);
         }
         
         animationFrameRef.current = requestAnimationFrame(animate);
     };

     animate();
  };

  const calculateRoute = () => {
      if ((!userLocation && !mapError) || !selectedDonation) return;

      const now = new Date();
      now.setMinutes(now.getMinutes() + 15); // Fake ETA
      const etaTime = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

      // --- MOCK MODE LOGIC ---
      if (mapError) {
          setTimeout(() => {
              setIsRouting(false);
              setRouteStats({
                  distance: "4.2 km",
                  duration: "12 mins",
                  eta: etaTime,
                  legs: [
                      { duration: { text: "5 mins" } },
                      { duration: { text: "7 mins" } }
                  ]
              });
          }, 500);
          return;
      }
      
      // --- REAL MODE LOGIC ---
      let pickupLoc = selectedDonation.geoLocation;
      if (!pickupLoc) {
           const centerLat = userLocation?.lat || 12.9716;
           const centerLng = userLocation?.lng || 77.5946;
           const idNum = selectedDonation.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
           pickupLoc = { 
               lat: centerLat + ((idNum % 20) - 10) * 0.003,
               lng: centerLng + ((idNum % 20) - 10) * 0.003
           };
      }

      if (!directionsServiceRef.current) {
          setMapError(true);
          return;
      }

      const request: any = {
          origin: userLocation,
          travelMode: google.maps.TravelMode.DRIVING,
      };

      if (selectedDonation.receiverLocation) {
          request.destination = selectedDonation.receiverLocation;
          request.waypoints = [{ location: pickupLoc, stopover: true }];
      } else {
          request.destination = pickupLoc;
      }

      directionsServiceRef.current.route(request, (result: any, status: any) => {
          setIsRouting(false);
          if (status === 'OK') {
              directionsRendererRef.current.setDirections(result);
              
              const route = result.routes[0];
              let totalDistVal = 0;
              let totalDurVal = 0;

              route.legs.forEach((leg: any) => {
                  totalDistVal += leg.distance.value;
                  totalDurVal += leg.duration.value;
              });

              setRouteStats({
                  distance: (totalDistVal / 1000).toFixed(1) + " km",
                  duration: Math.round(totalDurVal / 60) + " mins",
                  eta: new Date(Date.now() + totalDurVal * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                  legs: route.legs
              });

              // Trigger Bike Animation
              animateBike(route);

          } else {
              console.warn("Directions request failed due to " + status);
              // Fallback to Mock if Real Route fails
               setTimeout(() => {
                  setRouteStats({
                      distance: "4.2 km (Sim)",
                      duration: "12 mins",
                      eta: etaTime,
                      legs: []
                  });
                  alert("Could not calculate route via Google Directions. Showing simulation. (Check API Key permissions: Directions API must be enabled)");
              }, 500);
          }
      });
  };

  const clearSelection = () => {
      setSelectedDonation(null);
      setRouteStats(null);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (bikeMarkerRef.current) bikeMarkerRef.current.setMap(null);
      
      if (!mapError) {
          directionsRendererRef.current?.setDirections({ routes: [] });
          if (mapInstanceRef.current && userLocation) {
              mapInstanceRef.current.setZoom(14);
              mapInstanceRef.current.setCenter(userLocation);
          }
      }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-[600px] flex flex-col relative overflow-hidden">
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
            <h3 className="font-bold text-gray-800 flex items-center mr-2">
                <MapPin className="mr-2 text-brand-600" /> Live Navigation
            </h3>
            {!mapError && (
                <div className="flex items-center text-sm border border-gray-200 rounded-lg px-2 bg-gray-50">
                    <Palette size={14} className="text-gray-500 mr-2" />
                    <select 
                        value={currentStyle}
                        onChange={handleStyleChange}
                        className="bg-transparent border-none focus:ring-0 text-gray-700 py-1 cursor-pointer"
                    >
                        <option value="default">Default</option>
                        <option value="retro">Retro</option>
                        <option value="night">Night</option>
                        <option value="silver">Silver</option>
                    </select>
                </div>
            )}
            {mapError && (
                 <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200 uppercase font-bold">
                     Simulation Mode
                 </span>
            )}
        </div>
        
        <div className="flex items-center gap-2">
            {/* Range Filter */}
            <div className="flex items-center text-sm border border-gray-200 rounded-lg px-2 bg-gray-50 mr-2">
                <Target size={14} className="text-gray-500 mr-2" />
                <select 
                    value={rangeFilter}
                    onChange={(e) => setRangeFilter(Number(e.target.value))}
                    className="bg-transparent border-none focus:ring-0 text-gray-700 py-1 cursor-pointer"
                >
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={20}>20 km</option>
                    <option value={50}>50 km</option>
                </select>
            </div>
            
            {/* Entity Type Toggles */}
            <button 
                onClick={() => setShowDonations(!showDonations)}
                className={`text-xs px-2 py-1 rounded-lg border ${showDonations ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                title="Toggle Donations"
            >
                📦 Donations
            </button>
            <button 
                onClick={() => setShowNGOs(!showNGOs)}
                className={`text-xs px-2 py-1 rounded-lg border ${showNGOs ? 'bg-green-100 border-green-400 text-green-800' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                title="Toggle NGOs"
            >
                🏢 NGOs
            </button>
            <button 
                onClick={() => setShowRequesters(!showRequesters)}
                className={`text-xs px-2 py-1 rounded-lg border ${showRequesters ? 'bg-red-100 border-red-400 text-red-800' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                title="Toggle Requesters"
            >
                ⚡ Requesters
            </button>
            
             {!mapError && (
                 <button onClick={() => setMapError(true)} className="text-[10px] text-gray-400 hover:text-gray-600 underline" title="Force Simulation Mode">Force Sim</button>
             )}
            {userLocation && (
                <span className={`text-xs px-3 py-1 rounded-full flex items-center ${mapError ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700 animate-pulse'}`}>
                    <Navigation size={12} className="mr-1" /> GPS {mapError ? 'Simulated' : 'Active'}
                </span>
            )}
        </div>
      </div>
      
      <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden relative border border-gray-200">
        {isLocating && !userLocation && !mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20 backdrop-blur-sm">
                <Loader2 size={32} className="animate-spin text-brand-600 mb-2" />
                <p className="text-gray-600 font-medium">Acquiring Satellite Signal...</p>
            </div>
        )}
        
        <div ref={mapContainerRef} className={`w-full h-full ${mapError ? 'hidden' : 'block'}`} />

        {mapError && (
            <div className="absolute inset-0 bg-slate-900 relative overflow-hidden group">
                 {/* Map Pattern - Tech Grid */}
                 <div className="absolute inset-0 opacity-20" 
                      style={{
                          backgroundImage: `
                              linear-gradient(to right, #334155 1px, transparent 1px),
                              linear-gradient(to bottom, #334155 1px, transparent 1px)
                          `,
                          backgroundSize: '40px 40px'
                      }}
                 ></div>
                 
                 {/* Abstract City Blocks */}
                 <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-slate-800 rounded-lg opacity-50"></div>
                 <div className="absolute bottom-1/3 right-1/4 w-48 h-24 bg-slate-800 rounded-lg opacity-50"></div>
                 
                 {/* Radar Scan Effect */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(250,204,21,0.1)_360deg)] animate-[spin_4s_linear_infinite] rounded-full pointer-events-none opacity-30"></div>

                 {/* Label */}
                 <div className="absolute bottom-4 right-4 text-slate-600 font-mono text-xs font-bold uppercase tracking-widest pointer-events-none">
                     System Simulation /// Live
                 </div>

                 {/* ALL MARKERS VISUALIZATION - Donations, NGOs, Requesters */}
                 {/* User Location */}
                 <div className="absolute" style={{ top: '70%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                     <div className="w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-[0_0_20px_rgba(59,130,246,0.9)] animate-pulse"></div>
                     <span className="absolute top-7 left-1/2 -translate-x-1/2 text-blue-400 text-xs font-bold bg-black/70 px-2 py-1 rounded">YOU</span>
                 </div>

                 {/* Donation Markers (Yellow) - Always show sample if no data */}
                 {(!filteredDonations || filteredDonations.length === 0) && showDonations ? (
                     // Sample donation markers when no real data
                     <>
                         <div className="absolute cursor-pointer" style={{ top: '30%', left: '25%', transform: 'translate(-50%, -50%)' }}>
                             <MapPin className="text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]" size={36} fill="currentColor" />
                             <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-yellow-400 text-[10px] font-bold bg-black/70 px-1 py-0.5 rounded">Sample Donation</span>
                         </div>
                     </>
                 ) : (
                     filteredDonations.map((donation, index) => {
                         const positions = [
                             { top: '30%', left: '25%' },
                             { top: '35%', left: '65%' },
                             { top: '50%', left: '35%' },
                             { top: '45%', left: '75%' },
                         ];
                         const pos = positions[index % positions.length];
                         return (
                             <div 
                                 key={`donation-${donation.id}`}
                                 className="absolute cursor-pointer transform hover:scale-125 transition-transform"
                                 style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                                 onClick={() => setSelectedDonation(donation)}
                             >
                                 <div className="relative">
                                     <MapPin className="text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]" size={36} fill="currentColor" />
                                     {donation.status === 'Matched' && (
                                         <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-white">M</div>
                                     )}
                                 </div>
                                 <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-yellow-400 text-[10px] font-bold bg-black/70 px-1 py-0.5 rounded whitespace-nowrap max-w-[80px] truncate">
                                     {donation.title.substring(0, 15)}...
                                 </span>
                             </div>
                         );
                     })
                 )}

                 {/* NGO Markers (Green) - Always show sample if no data */}
                 {(!filteredNGOs || filteredNGOs.length === 0) && showNGOs ? (
                     <>
                         <div className="absolute cursor-pointer" style={{ top: '25%', left: '45%', transform: 'translate(-50%, -50%)' }}>
                             <MapPin className="text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" size={36} fill="currentColor" />
                             <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-green-400 text-[10px] font-bold bg-black/70 px-1 py-0.5 rounded">Sample NGO</span>
                         </div>
                     </>
                 ) : (
                     filteredNGOs.map((ngo, index) => {
                         const positions = [
                             { top: '25%', left: '45%' },
                             { top: '40%', left: '55%' },
                             { top: '55%', left: '25%' },
                             { top: '60%', left: '70%' },
                         ];
                         const pos = positions[index % positions.length];
                         return (
                             <div 
                                 key={`ngo-${ngo.id}`}
                                 className="absolute cursor-pointer transform hover:scale-125 transition-transform"
                                 style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                                 onClick={() => setSelectedEntity({type: 'ngo', data: ngo})}
                             >
                                 <MapPin className="text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" size={36} fill="currentColor" />
                                 <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-green-400 text-[10px] font-bold bg-black/70 px-1 py-0.5 rounded whitespace-nowrap max-w-[80px] truncate">
                                     {ngo.name.substring(0, 12)}...
                                 </span>
                             </div>
                         );
                     })
                 )}

                 {/* Requester Markers - Always show sample if no data */}
                 {(!filteredRequesters || filteredRequesters.length === 0) && showRequesters ? (
                     <>
                         <div className="absolute cursor-pointer animate-bounce" style={{ top: '20%', left: '70%', transform: 'translate(-50%, -50%)' }}>
                             <MapPin className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.9)]" size={36} fill="currentColor" />
                             <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-red-400 text-[10px] font-bold bg-black/70 px-1 py-0.5 rounded">Urgent Request</span>
                             <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-white">C</div>
                         </div>
                     </>
                 ) : (
                     filteredRequesters.map((requester, index) => {
                         const urgencyColors: Record<string, string> = {
                             'Critical': 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.9)]',
                             'High': 'text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.9)]',
                             'Medium': 'text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.9)]',
                             'Low': 'text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.9)]',
                         };
                         const positions = [
                             { top: '20%', left: '70%' },
                             { top: '35%', left: '45%' },
                             { top: '50%', left: '60%' },
                             { top: '65%', left: '40%' },
                         ];
                         const pos = positions[index % positions.length];
                         const colorClass = urgencyColors[requester.urgency] || 'text-red-500';
                         return (
                             <div 
                                 key={`requester-${requester.id}`}
                                 className="absolute cursor-pointer transform hover:scale-125 transition-transform animate-bounce"
                                 style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                                 onClick={() => setSelectedEntity({type: 'requester', data: requester})}
                             >
                                 <MapPin className={colorClass} size={36} fill="currentColor" />
                                 <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold bg-black/70 px-1 py-0.5 rounded whitespace-nowrap max-w-[80px] truncate ${
                                     requester.urgency === 'Critical' ? 'text-red-400' :
                                     requester.urgency === 'High' ? 'text-orange-400' :
                                     requester.urgency === 'Medium' ? 'text-yellow-400' : 'text-blue-400'
                                 }`}>
                                     {requester.name.substring(0, 12)}...
                                 </span>
                                 <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-white ${
                                     requester.urgency === 'Critical' ? 'bg-red-600' :
                                     requester.urgency === 'High' ? 'bg-orange-500' :
                                     requester.urgency === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                 }`}>
                                     {requester.urgency[0]}
                                 </div>
                             </div>
                         );
                     })
                 )}

                 {/* Legend for simulation mode */}
                 <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-slate-700 z-20">
                     <div className="text-[10px] text-slate-400 font-bold uppercase mb-2">Map Legend</div>
                     <div className="flex flex-col gap-1 text-xs">
                         <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                             <span className="text-slate-300">Donations</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                             <span className="text-slate-300">NGOs</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                             <span className="text-slate-300">Critical Request</span>
                         </div>
                     </div>
                 </div>

                 {/* Counts */}
                 <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-slate-700 z-20">
                     <div className="text-[10px] text-slate-400 font-bold uppercase mb-2">Nearby</div>
                     <div className="flex flex-col gap-1 text-xs">
                         <div className="flex justify-between gap-4">
                             <span className="text-slate-300">📦 Donations:</span>
                             <span className="text-yellow-400 font-bold">{filteredDonations.length}</span>
                         </div>
                         <div className="flex justify-between gap-4">
                             <span className="text-slate-300">🏢 NGOs:</span>
                             <span className="text-green-400 font-bold">{filteredNGOs.length}</span>
                         </div>
                         <div className="flex justify-between gap-4">
                             <span className="text-slate-300">⚡ Requests:</span>
                             <span className="text-red-400 font-bold">{filteredRequesters.length}</span>
                         </div>
                     </div>
                 </div>

                 {/* SIMULATION ROUTE VISUALIZATION (Multi-Leg) */}
                 {selectedDonation && routeStats && (
                     <>
                        <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
                             <defs>
                                 <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                     <stop offset="0%" stopColor="#3b82f6" />
                                     <stop offset="50%" stopColor="#eab308" />
                                     <stop offset="100%" stopColor="#22c55e" />
                                 </linearGradient>
                             </defs>
                             {/* 
                                 Coordinates simplified for demo:
                                 Start (You): 50%, 80% (Bottom Center)
                                 Pickup (Donor): 30%, 40% (Top Left)
                                 Dropoff (Receiver): 70%, 40% (Top Right)
                             */}
                             <path 
                                 d="M 50% 80% L 30% 40% L 70% 40%" 
                                 fill="none"
                                 stroke="url(#routeGradient)" 
                                 strokeWidth="4" 
                                 strokeLinecap="round"
                                 strokeDasharray="8,8"
                                 className="animate-pulse opacity-80"
                             />
                        </svg>

                        {/* Simulated Pins */}
                        {/* YOU */}
                        <div className="absolute" style={{ top: '80%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse"></div>
                            <span className="absolute top-5 left-1/2 -translate-x-1/2 text-blue-400 text-[10px] font-bold">YOU</span>
                        </div>
                        {/* PICKUP */}
                        <div className="absolute" style={{ top: '40%', left: '30%', transform: 'translate(-50%, -50%)' }}>
                            <MapPin className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]" size={32} fill="currentColor" />
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-yellow-500 text-[10px] font-bold whitespace-nowrap">PICKUP</span>
                        </div>
                        {/* DROPOFF */}
                        <div className="absolute" style={{ top: '40%', left: '70%', transform: 'translate(-50%, -50%)' }}>
                            <MapPin className="text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]" size={32} fill="currentColor" />
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-green-500 text-[10px] font-bold whitespace-nowrap">DROPOFF</span>
                        </div>

                        {/* ANIMATED MOVING BIKE */}
                        <div 
                            className="absolute w-8 h-8 z-20 flex items-center justify-center text-white filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                            style={{
                                animation: 'sim-route-move 6s infinite linear',
                            }}
                        >
                            <Bike size={24} fill="currentColor" />
                            <style>{`
                                @keyframes sim-route-move {
                                    0% { top: 80%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); }
                                    40% { top: 40%; left: 30%; transform: translate(-50%, -50%) rotate(0deg); }
                                    50% { top: 40%; left: 30%; transform: translate(-50%, -50%) rotate(90deg); } /* Wait at pickup */
                                    100% { top: 40%; left: 70%; transform: translate(-50%, -50%) rotate(0deg); }
                                }
                            `}</style>
                        </div>
                     </>
                 )}
            </div>
        )}

        {selectedDonation && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/90 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl z-30 border border-brand-500 animate-in slide-in-from-bottom-5">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className="text-lg font-bold text-yellow-400 flex items-center">
                            {selectedDonation.title}
                            {selectedDonation.receiverLocation && <span className="ml-2 text-xs bg-brand-500 text-black px-1 rounded">2 Stops</span>}
                        </h4>
                        <p className="text-sm text-gray-400">Pickup: {selectedDonation.location}</p>
                    </div>
                    <button onClick={clearSelection} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="flex items-center gap-4 mt-3">
                    {routeStats ? (
                        <div className="flex-1 flex flex-col gap-2">
                             {/* REDESIGNED STATS PANEL - LEFT: TIME, RIGHT: DISTANCE */}
                             <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl border border-white/20 shadow-inner">
                                {/* LEFT: Time */}
                                <div className="flex flex-col items-start border-r border-white/10 pr-6 w-1/2">
                                    <div className="flex items-center text-yellow-400">
                                        <Clock size={20} className="mr-2" />
                                        <span className="text-2xl font-bold tracking-tight">{routeStats.duration}</span>
                                    </div>
                                    <span className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                                        ETA: {routeStats.eta}
                                    </span>
                                </div>
                                
                                {/* RIGHT: Distance */}
                                <div className="flex flex-col items-end pl-6 w-1/2">
                                    <div className="flex items-center text-white">
                                        <span className="text-2xl font-bold tracking-tight">{routeStats.distance}</span>
                                        <Navigation size={20} className="ml-2 text-brand-500" />
                                    </div>
                                    <span className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                                        Total Distance
                                    </span>
                                </div>
                            </div>
                            
                            {/* Trip Leg Timeline */}
                            <div className="mt-3 flex items-center text-xs text-gray-400 justify-between relative px-2">
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-700 -z-10"></div>
                                <div className="flex flex-col items-center bg-black px-1 z-10">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mb-1 ring-2 ring-black"></div>
                                    <span>Start</span>
                                </div>
                                {/* Animated Bike Indicator on timeline (static visual for context) */}
                                <div className="absolute left-1/4 -top-3 animate-pulse text-yellow-400 z-20">
                                    <Bike size={16} fill="currentColor" />
                                </div>
                                
                                <div className="flex flex-col items-center bg-black px-1 z-10">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full mb-1 ring-2 ring-black"></div>
                                    <span>Pickup</span>
                                </div>
                                <div className="flex flex-col items-center bg-black px-1 z-10">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mb-1 ring-2 ring-black"></div>
                                    <span>Dropoff</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${selectedDonation.urgency === 'Critical' ? 'bg-red-500 text-white' : 'bg-gray-700'}`}>{selectedDonation.urgency}</span>
                            <span>{selectedDonation.quantity}</span>
                        </div>
                    )}
                </div>

                {!routeStats && (
                    <button onClick={calculateRoute} disabled={isRouting} className="w-full mt-4 bg-brand-500 hover:bg-brand-600 text-black font-bold py-3 rounded-lg flex items-center justify-center transition-colors">
                        {isRouting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Navigation className="mr-2" size={18} />}
                        {isRouting ? "Calculating Route..." : "Start Navigation"}
                    </button>
                )}
                {routeStats && (
                    <button 
                        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(22,163,74,0.4)]" 
                        onClick={() => {
                            const destination = selectedDonation?.receiverLocation || selectedDonation?.geoLocation;
                            if (destination) {
                                const lat = destination.lat;
                                const lng = destination.lng;
                                // Open Google Maps Navigation
                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                            }
                        }}
                    >
                        <Navigation className="mr-2" size={18} fill="currentColor" />
                        Open in Google Maps
                    </button>
                )}
            </div>
        )}

        {/* NGO/Requester Info Panel */}
        {selectedEntity && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/90 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl z-30 border border-green-500 animate-in slide-in-from-bottom-5">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className="text-lg font-bold flex items-center">
                            {selectedEntity.type === 'ngo' ? (
                                <><span className="text-green-400 mr-2">🏢</span> {selectedEntity.data.name}</>
                            ) : (
                                <><span className="text-red-400 mr-2">⚡</span> {selectedEntity.data.name}</>
                            )}
                        </h4>
                        <p className="text-sm text-gray-400">
                            {selectedEntity.type === 'ngo' 
                                ? selectedEntity.data.description 
                                : selectedEntity.data.description || `${selectedEntity.data.category} - Needs ${selectedEntity.data.quantityNeeded} items`}
                        </p>
                    </div>
                    <button onClick={() => setSelectedEntity(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                            selectedEntity.data.urgency === 'Critical' ? 'bg-red-500 text-white' : 
                            selectedEntity.data.urgency === 'High' ? 'bg-orange-500 text-white' :
                            selectedEntity.data.urgency === 'Medium' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'
                        }`}>
                            {selectedEntity.data.urgency} Priority
                        </span>
                        <span>{selectedEntity.data.category}</span>
                        {selectedEntity.type === 'ngo' && (
                            <span className="text-green-400">★ {selectedEntity.data.rating}</span>
                        )}
                        {selectedEntity.type === 'requester' && (
                            <span>Need: {selectedEntity.data.quantityNeeded}</span>
                        )}
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <button 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg flex items-center justify-center transition-colors"
                        onClick={() => {
                            if (selectedEntity.data.geoLocation) {
                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedEntity.data.geoLocation.lat},${selectedEntity.data.geoLocation.lng}`, '_blank');
                            }
                        }}
                    >
                        <Navigation size={16} className="mr-2" />
                        Get Directions
                    </button>
                    {selectedEntity.type === 'ngo' && (
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg flex items-center justify-center transition-colors">
                            <User size={16} className="mr-2" />
                            Contact NGO
                        </button>
                    )}
                    {selectedEntity.type === 'requester' && (
                        <button className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2 rounded-lg flex items-center justify-center transition-colors">
                            <MapPin size={16} className="mr-2" />
                            Help Request
                        </button>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
