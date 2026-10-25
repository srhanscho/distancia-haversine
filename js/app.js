// Interfaz del demo: lee las coordenadas, llama a geo.js y dibuja el mapa.

var lugares = [
  ['Barranquilla', 10.9685, -74.7813],
  ['Bogota', 4.7110, -74.0721],
  ['Medellin', 6.2442, -75.5812],
  ['Cartagena', 10.3910, -75.4794],
  ['Santa Marta', 11.2408, -74.1990],
  ['Ciudad de Mexico', 19.4326, -99.1332],
  ['Madrid', 40.4168, -3.7038],
  ['Tokio', 35.6762, 139.6503],
  ['Polo Norte', 90, 0]
];

function $(id) { return document.getElementById(id); }

function fmt(n, dec) { return n.toFixed(dec); }

function llenarSelect(sel, indice) {
  var html = '<option value="">(escribir coordenadas)</option>';
  for (var i = 0; i < lugares.length; i++) {
    html += '<option value="' + i + '">' + lugares[i][0] + '</option>';
  }
  sel.innerHTML = html;
  sel.value = indice;
}

function usarPreset(sel, latId, lonId) {
  if (sel.value === '') return;
  var l = lugares[parseInt(sel.value, 10)];
  $(latId).value = l[1];
  $(lonId).value = l[2];
  calcular();
}

function calcular() {
  var lat1 = parseFloat($('latA').value), lon1 = parseFloat($('lonA').value);
  var lat2 = parseFloat($('latB').value), lon2 = parseFloat($('lonB').value);
  var R = parseFloat($('radio').value);
  $('msg').textContent = '';

  if ([lat1, lon1, lat2, lon2, R].some(isNaN)) {
    $('msg').textContent = 'Faltan datos o hay un valor que no es numero.';
    return;
  }
  if (Math.abs(lat1) > 90 || Math.abs(lat2) > 90 || Math.abs(lon1) > 180 || Math.abs(lon2) > 180) {
    $('msg').textContent = 'La latitud va de -90 a 90 y la longitud de -180 a 180.';
    return;
  }
  if (R <= 0) {
    $('msg').textContent = 'El radio tiene que ser mayor que cero.';
    return;
  }

  var h = distanciaHaversine(lat1, lon1, lat2, lon2, R);
  var dCos = distanciaCosenos(lat1, lon1, lat2, lon2, R);
  var dPlano = distanciaPlana(lat1, lon1, lat2, lon2, R);
  var rumbo = rumboInicial(lat1, lon1, lat2, lon2);

  $('distancia').textContent = fmt(h.d, 2) + ' km';
  $('tA').textContent = '(' + lat1 + ', ' + lon1 + ')';
  $('tB').textContent = '(' + lat2 + ', ' + lon2 + ')';
  $('tC').textContent = fmt(h.c, 6) + ' rad  (' + fmt(h.c * 180 / Math.PI, 4) + '°)';
  $('tCos').textContent = fmt(dCos, 2) + ' km  (diferencia: ' + Math.abs(dCos - h.d).toExponential(2) + ' km)';
  $('tPlano').textContent = fmt(dPlano, 2) + ' km  (error: ' + fmt(Math.abs(dPlano - h.d), 2) + ' km)';
  $('tRumbo').textContent = (h.d === 0) ? 'no aplica' : fmt(rumbo, 1) + '° (0 = norte, 90 = este)';

  var p1 = aRadianes(lat1), p2 = aRadianes(lat2);
  var dPhi = p2 - p1, dLam = aRadianes(lon2 - lon1);
  $('pasos').textContent =
    '1) A radianes: phi1 = ' + fmt(p1, 6) + ', phi2 = ' + fmt(p2, 6) + '\n' +
    '   dphi = ' + fmt(dPhi, 6) + ', dlambda = ' + fmt(dLam, 6) + '\n' +
    '2) a = sin^2(dphi/2) + cos(phi1)cos(phi2)sin^2(dlambda/2)\n' +
    '     = ' + fmt(hav(dPhi), 8) + ' + ' + fmt(Math.cos(p1) * Math.cos(p2), 6) + ' * ' + fmt(hav(dLam), 8) + '\n' +
    '     = ' + fmt(h.a, 8) + '\n' +
    '3) c = 2 atan2(sqrt(a), sqrt(1-a)) = ' + fmt(h.c, 8) + ' rad\n' +
    '4) d = R c = ' + R + ' * ' + fmt(h.c, 8) + ' = ' + fmt(h.d, 3) + ' km';

  dibujar(lat1, lon1, lat2, lon2);
}

function dibujar(lat1, lon1, lat2, lon2) {
  var cv = $('mapa'), g = cv.getContext('2d');
  var W = cv.width, H = cv.height;
  function px(lon) { return (lon + 180) / 360 * W; }
  function py(lat) { return (90 - lat) / 180 * H; }

  g.clearRect(0, 0, W, H);
  // cuadricula cada 30 grados
  g.strokeStyle = '#b9cfe0'; g.lineWidth = 1; g.setLineDash([]);
  for (var lo = -180; lo <= 180; lo += 30) { g.beginPath(); g.moveTo(px(lo), 0); g.lineTo(px(lo), H); g.stroke(); }
  for (var la = -90; la <= 90; la += 30) { g.beginPath(); g.moveTo(0, py(la)); g.lineTo(W, py(la)); g.stroke(); }
  g.strokeStyle = '#7fa3bf';
  g.beginPath(); g.moveTo(0, py(0)); g.lineTo(W, py(0)); g.stroke();
  g.beginPath(); g.moveTo(px(0), 0); g.lineTo(px(0), H); g.stroke();
  g.fillStyle = '#557'; g.font = '11px Arial';
  g.fillText('Ecuador', 4, py(0) - 3);
  g.fillText('Greenwich', px(0) + 3, 12);

  // recta en el mapa
  g.strokeStyle = '#888'; g.setLineDash([5, 4]);
  g.beginPath(); g.moveTo(px(lon1), py(lat1)); g.lineTo(px(lon2), py(lat2)); g.stroke();
  g.setLineDash([]);

  // arco de circulo maximo, partido si cruza la linea de 180
  g.strokeStyle = '#c0392b'; g.lineWidth = 2;
  g.beginPath();
  var antes = null;
  for (var i = 0; i <= 100; i++) {
    var pt = puntoIntermedio(lat1, lon1, lat2, lon2, i / 100);
    if (antes === null || Math.abs(pt[1] - antes[1]) > 180) g.moveTo(px(pt[1]), py(pt[0]));
    else g.lineTo(px(pt[1]), py(pt[0]));
    antes = pt;
  }
  g.stroke();

  marcar(g, px(lon1), py(lat1), 'A');
  marcar(g, px(lon2), py(lat2), 'B');
}

function marcar(g, x, y, txt) {
  g.fillStyle = '#1a5276';
  g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
  g.font = 'bold 13px Arial';
  g.fillText(txt, x + 7, y - 6);
}

// se puede abrir con index.html#0,6 para cargar otros lugares de la lista
var ini = location.hash.replace('#', '').split(',');
var iA = parseInt(ini[0], 10) || 0;
var iB = isNaN(parseInt(ini[1], 10)) ? 1 : parseInt(ini[1], 10);
llenarSelect($('presetA'), iA);
llenarSelect($('presetB'), iB);
$('latA').value = lugares[iA][1]; $('lonA').value = lugares[iA][2];
$('latB').value = lugares[iB][1]; $('lonB').value = lugares[iB][2];
$('presetA').onchange = function () { usarPreset(this, 'latA', 'lonA'); };
$('presetB').onchange = function () { usarPreset(this, 'latB', 'lonB'); };
$('calcular').onclick = calcular;
calcular();
