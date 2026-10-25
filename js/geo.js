// Calculos de distancia sobre una esfera.
// Solo se usa Math (incluido en JavaScript), sin librerias externas.

var RADIO_TIERRA = 6371; // km, radio medio

function aRadianes(grados) {
  return grados * Math.PI / 180;
}

function aGrados(rad) {
  return rad * 180 / Math.PI;
}

// hav(x) = sin^2(x/2) = (1 - cos x) / 2
function hav(x) {
  var s = Math.sin(x / 2);
  return s * s;
}

// Formula del semiverseno (haversine)
function distanciaHaversine(lat1, lon1, lat2, lon2, radio) {
  radio = radio || RADIO_TIERRA;
  var p1 = aRadianes(lat1);
  var p2 = aRadianes(lat2);
  var dLat = p2 - p1;
  var dLon = aRadianes(lon2 - lon1);

  var a = hav(dLat) + Math.cos(p1) * Math.cos(p2) * hav(dLon);
  // por errores de redondeo a puede pasar de 1 en puntos antipodas
  if (a > 1) a = 1;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return { a: a, c: c, d: radio * c };
}

// Ley esferica de los cosenos (para comparar)
function distanciaCosenos(lat1, lon1, lat2, lon2, radio) {
  radio = radio || RADIO_TIERRA;
  var p1 = aRadianes(lat1);
  var p2 = aRadianes(lat2);
  var dLon = aRadianes(lon2 - lon1);
  var x = Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(dLon);
  if (x > 1) x = 1;
  if (x < -1) x = -1;
  return radio * Math.acos(x);
}

// Distancia "plana": tratar lat/lon como si fuera un plano (para ver el error)
function distanciaPlana(lat1, lon1, lat2, lon2, radio) {
  radio = radio || RADIO_TIERRA;
  var dx = aRadianes(lon2 - lon1);
  var dy = aRadianes(lat2 - lat1);
  return radio * Math.sqrt(dx * dx + dy * dy);
}

// Rumbo inicial desde A hacia B (0 = norte, 90 = este)
function rumboInicial(lat1, lon1, lat2, lon2) {
  var p1 = aRadianes(lat1);
  var p2 = aRadianes(lat2);
  var dLon = aRadianes(lon2 - lon1);
  var y = Math.sin(dLon) * Math.cos(p2);
  var x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dLon);
  return (aGrados(Math.atan2(y, x)) + 360) % 360;
}

// Punto intermedio del arco (fraccion f entre 0 y 1), sirve para dibujar la ruta
function puntoIntermedio(lat1, lon1, lat2, lon2, f) {
  var p1 = aRadianes(lat1), l1 = aRadianes(lon1);
  var p2 = aRadianes(lat2), l2 = aRadianes(lon2);
  var c = distanciaHaversine(lat1, lon1, lat2, lon2, 1).c;
  if (c === 0) return [lat1, lon1];
  var A = Math.sin((1 - f) * c) / Math.sin(c);
  var B = Math.sin(f * c) / Math.sin(c);
  var x = A * Math.cos(p1) * Math.cos(l1) + B * Math.cos(p2) * Math.cos(l2);
  var y = A * Math.cos(p1) * Math.sin(l1) + B * Math.cos(p2) * Math.sin(l2);
  var z = A * Math.sin(p1) + B * Math.sin(p2);
  var lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  var lon = Math.atan2(y, x);
  return [aGrados(lat), aGrados(lon)];
}

if (typeof module !== 'undefined') {
  module.exports = {
    aRadianes: aRadianes, hav: hav,
    distanciaHaversine: distanciaHaversine,
    distanciaCosenos: distanciaCosenos,
    distanciaPlana: distanciaPlana,
    rumboInicial: rumboInicial,
    puntoIntermedio: puntoIntermedio
  };
}
