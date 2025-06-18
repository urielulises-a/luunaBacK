const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

function toRad(value) {
  return value * Math.PI / 180;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // distancia en km
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const toRad = (deg) => deg * (Math.PI / 180);

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distancia en km
}

function estimateTime(distanceKm, speedKmh = 40) {
  const hours = distanceKm / speedKmh;
  const totalSeconds = Math.round(hours * 3600);
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatDateToMySQLWithOffset(isoDateStr, offsetHours = -6) {
  const date = new Date(isoDateStr);

  // Obtener la hora UTC y restarle el offset en horas
  const utcHours = date.getUTCHours() + offsetHours;

  // Construimos la nueva fecha ajustada en UTC, con el offset aplicado
  date.setUTCHours(utcHours);

  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
         `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}



async function findTripsNearby(origin, destination, maxDistanceKm = 1) {
  const query = `
    SELECT 
      v.id_viaje, v.id_conductor, v.costo, v.estado,
      v.fecha_hora_inicio, v.fecha_hora_fin,
      r.distancia, r.tiempo_estimado, r.coordenadas_inicio, r.coordenadas_fin,
      CAST(SUBSTRING_INDEX(r.coordenadas_inicio, ',', -1) AS DECIMAL(10, 8)) AS lat_inicio,
      CAST(SUBSTRING_INDEX(r.coordenadas_inicio, ',', 1) AS DECIMAL(11, 8)) AS lng_inicio,
      CAST(SUBSTRING_INDEX(r.coordenadas_fin, ',', -1) AS DECIMAL(10, 8)) AS lat_fin,
      CAST(SUBSTRING_INDEX(r.coordenadas_fin, ',', 1) AS DECIMAL(11, 8)) AS lng_fin,
      u.nombre AS conductor_nombre,
      u.apellido AS conductor_apellido,
      u.telefono AS conductor_telefono,
      a.marca AS auto_marca,
      a.modelo AS auto_modelo,
      a.color AS auto_color,
      a.placa AS auto_placa,
      a.capacidad AS auto_capacidad
    FROM viaje v
    JOIN ruta r ON v.id_ruta = r.id_ruta
    JOIN usuario u ON v.id_conductor = u.id_usuario
    LEFT JOIN auto a ON u.id_auto = a.id_auto
    WHERE v.estado = 'esperando'
  `;

  try {
    const [trips] = await db.query(query);

    return trips.filter(trip => {
      const distOrigen = calculateDistance(origin.lat, origin.lng, trip.lat_inicio, trip.lng_inicio);
      const distDestino = calculateDistance(destination.lat, destination.lng, trip.lat_fin, trip.lng_fin);

      return distOrigen <= maxDistanceKm && distDestino <= maxDistanceKm;
    });
  } catch (err) {
    console.error('Error in findTripsNearby:', err);
    throw err;
  }
}




async function getTrips() {
    const query = `
    SELECT 
      v.id_viaje, v.id_conductor, v.estado, v.costo, v.fecha_hora_inicio, v.fecha_hora_fin,
      r.distancia, r.tiempo_estimado, r.coordenadas_inicio, r.coordenadas_fin,
      u.nombre AS conductor_nombre,
      u.apellido AS conductor_apellido,
      u.telefono AS conductor_telefono,
      a.marca AS auto_marca,
      a.modelo AS auto_modelo,
      a.color AS auto_color,
      a.placa AS auto_placa,
      a.capacidad AS auto_capacidad
    FROM viaje v
    JOIN ruta r ON v.id_ruta = r.id_ruta
    JOIN usuario u ON v.id_conductor = u.id_usuario
    LEFT JOIN auto a ON u.id_auto = a.id_auto
  `;
      try {
    const [rows, fields] = await db.query(query);
    return rows;
  } catch (err) {
    throw err;
  }
}

async function addTrip({ driverId, origin, destination, schedule, fare }) {
  const routeId = uuidv4();
  const tripId = uuidv4();
    // Convertir coordenadas a string "lng,lat"
  const coordInicio = `${origin.lng},${origin.lat}`;
  const coordFin = `${destination.lng},${destination.lat}`;

  const distancia = haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng).toFixed(2);
  const tiempo_estimado = estimateTime(distancia);

  const mysqlSchedule = formatDateToMySQLWithOffset(schedule, -6); // UTC-6 para México


  try {
    const insertRoute = `
      INSERT INTO ruta (id_ruta, coordenadas_inicio, coordenadas_fin, distancia, tiempo_estimado)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.query(insertRoute, [routeId, coordInicio, coordFin, distancia, tiempo_estimado]);


    const insertTrip = `
      INSERT INTO viaje (id_viaje, id_conductor, id_ruta, estado, costo, fecha_hora_inicio)
      VALUES (?, ?, ?, 'esperando', ?, ?)
    `;
    await db.query(insertTrip, [tripId, driverId, routeId, fare, mysqlSchedule]);

    return tripId;
  } catch (err) {
    throw err;
  }
}

async function updateTripStatus(tripId, status) {
  try {
    const query = "UPDATE viaje SET estado = ? WHERE id_viaje = ?";
    const [result] = await db.query(query, [status, tripId]);
    return result.affectedRows > 0;
  } catch (err) {
    throw err;
  }
}

module.exports = { getTrips, addTrip, updateTripStatus, findTripsNearby };
