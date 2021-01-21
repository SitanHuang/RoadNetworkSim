const $canvas = $('#canvas');
const $tooltip = $('#tooltip');
const $canvas_container = $('#canvasContainer');
const $canvas_bound = $('#canvasBound');

const BLOCK_SIZE = 20;
const OFFSET_X = 22; // account for red border & margin
const OFFSET_Y = 22;

const HOVER_NODE_RADIUS = 3;
const HOVER_NODE_BORDER = 3;
const CLIP_COEF = 1;

const NODE_RADIUS = 2;
const NODE_BORDER = 1;
const CAR_RADIUS = 0.25;
const CAR_BORDER = 1;

const NODE_BUILDING_RADIUS = 1;

const INTERSECTION_STYLES = {
  bypass: `border: ${NODE_BORDER}px solid rgba(0, 0, 0, 0.2);background: white;`,
  yield: `border: ${NODE_BORDER}px solid rgb(255 193 127);background: white;`,
  stop: `border: ${NODE_BORDER}px solid red;background: white;`,
  light: `border: ${NODE_BORDER}px solid blue;background: rgb(255 193 127);`,
};
function cvs_draw_node(node) {
  node = node.id ? node : world.nodes[road];

  $canvas_container.append(`<node id="${node.id}" style="
    left: ${BLOCK_SIZE * (node.coor[0]) + OFFSET_X - NODE_RADIUS - NODE_BORDER}px;
    top: ${BLOCK_SIZE * (node.coor[1]) + OFFSET_Y - NODE_RADIUS - NODE_BORDER}px;
    width: ${NODE_RADIUS * 2}px;
    height: ${NODE_RADIUS * 2}px;
    ${INTERSECTION_STYLES[node.intersection.type]}
  "></node>`);
}
function cvs_update_all_cars() {
  for (let id in _carsShown) {
    let car = world.cars[id];
    let $car = _carsShown[id];
    cvs_car_pos_css($car, car.coor, world.roads[car.road].type.css_class);
  }
}
function cvs_car_pos_css(ele, coor, css_class) {
  ele.css('left', BLOCK_SIZE * (coor[0]) + OFFSET_X - CAR_RADIUS - CAR_BORDER)
    .css('top', BLOCK_SIZE * (coor[1]) + OFFSET_Y - CAR_RADIUS - CAR_BORDER);
  if (css_class) ele.attr('class', css_class);
}
function cvs_draw_car(car, coor) {
  let ele = $(`<car id="${car.id}" data-loc = "${car.loc}"/>`);
  cvs_car_pos_css(ele, coor, world.roads[car.road].type.css_class);
  $canvas_container.append(ele);
  return ele;
}
function cvs_draw_mock_road(line, type) {
  let coori = line[0];
  let coorf = line[1];

  let height = type.height + type.border * 2;

  let dcoori = [(coori[0]) * BLOCK_SIZE + OFFSET_X - height / 2,
                (coori[1]) * BLOCK_SIZE + OFFSET_X - height / 2];
  let dcoorf = [(coorf[0]) * BLOCK_SIZE + OFFSET_X - height / 2,
                (coorf[1]) * BLOCK_SIZE + OFFSET_X - height / 2];

  let length_original = geometric.lineLength([coori.map(x => x * BLOCK_SIZE), coorf.map(x => x * BLOCK_SIZE)]);
  let length = geometric.lineLength([dcoori, dcoorf]);
  let angle = geometric.lineAngle([dcoori, dcoorf]);
  let width = length + height / 2;

  let $n = $(`<road class="${type.css_class} irremovable" style="
    left: ${dcoori[0]}px;
    top: ${dcoori[1]}px;
    width: ${width}px;
    height: ${type.height}px;
    border-width: ${type.border}px 0;
    border-radius: ${height}px;
    transform-origin: ${type.height / 2 + type.border}px ${type.height / 2 + type.border}px;
    transform: rotate(${angle}deg);
  "/>`)
  $canvas_container.append($n);
  return $n;
}

var _cvs_request_road_callback = null;
function cvs_draw_road(road) {
  road = road.id ? road : world.roads[road];
  let coori = world.nodes[road.node1].coor;
  let coorf = world.nodes[road.node2].coor;
  let line = [coori, coorf];

  let height = road.type.height + road.type.border * 2;

  let dcoori = [(coori[0]) * BLOCK_SIZE + OFFSET_X - height / 2,
                (coori[1]) * BLOCK_SIZE + OFFSET_X - height / 2];
  let dcoorf = [(coorf[0]) * BLOCK_SIZE + OFFSET_X - height / 2,
                (coorf[1]) * BLOCK_SIZE + OFFSET_X - height / 2];

  let length_original = geometric.lineLength([coori.map(x => x * BLOCK_SIZE), coorf.map(x => x * BLOCK_SIZE)]);
  let length = geometric.lineLength([dcoori, dcoorf]);
  let angle = geometric.lineAngle([dcoori, dcoorf]);
  let width = length + height / 2;

  let $n = $(`<road id="${road.id}" class="${road.type.css_class}" style="
    left: ${dcoori[0]}px;
    top: ${dcoori[1]}px;
    width: ${width}px;
    height: ${road.type.height}px;
    border-width: ${road.type.border}px 0;
    border-radius: ${height}px;
    transform-origin: ${road.type.height / 2 + road.type.border}px ${road.type.height / 2 + road.type.border}px;
    transform: rotate(${angle}deg);
  "/>`);
  if (_cvs_request_road_callback)
    $n.css('cursor', 'pointer').click(() => {
      _cvs_request_road_callback(road);
    });
  $canvas_container.append($n);

  let interpolator = geometric.lineInterpolate([dcoori, dcoorf]);

  road.buildings.forEach((b, i) => {
    let coor = interpolator(b[1]);
    $n.append(`<node class="building" id="${building_id(road, i)}" style="
      top: ${road.type.height / 2 - NODE_BUILDING_RADIUS * BUILDINGS[b[0]].radius}px;
      left: ${b[1] * length_original}px;
      width: ${NODE_BUILDING_RADIUS * BUILDINGS[b[0]].radius * 2}px;
      height: ${NODE_BUILDING_RADIUS * BUILDINGS[b[0]].radius * 2}px;
      background: ${BUILDINGS[b[0]].color};
    "/>`);
  });

  return $n;
}

var camera = {real: {x: 0, y: 0, bx: 0, by: 0}, coor: {x: 0, y: 0, bx: 0, by: 0}, bound_coor: {x: 0, y: 0, bx: 0, by: 0}};
function cvs_update_camera(sl, st) {
  camera.real.x = (sl || $canvas.scrollLeft()) / _ui_current_zoom;
  camera.real.y = (st || $canvas.scrollTop()) / _ui_current_zoom;
  camera.real.bx = camera.real.x + $canvas.outerWidth() / _ui_current_zoom;
  camera.real.by = camera.real.y + $canvas.outerHeight() / _ui_current_zoom;
  camera.coor.x = camera.real.x / BLOCK_SIZE;
  camera.coor.y = camera.real.y / BLOCK_SIZE;
  camera.coor.bx = camera.real.bx / BLOCK_SIZE;
  camera.coor.by = camera.real.by / BLOCK_SIZE;
  camera.bound_coor.x = (camera.real.x - $canvas.outerWidth() / _ui_current_zoom * 0.1) / BLOCK_SIZE;
  camera.bound_coor.y = (camera.real.y - $canvas.outerHeight() / _ui_current_zoom * 0.1) / BLOCK_SIZE;
  camera.bound_coor.bx = (camera.real.bx + $canvas.outerWidth() / _ui_current_zoom * 0.1) / BLOCK_SIZE;
  camera.bound_coor.by = (camera.real.by + $canvas.outerHeight() / _ui_current_zoom * 0.1) / BLOCK_SIZE;
  camera.bound_coor_rect = [[camera.bound_coor.x, camera.bound_coor.y],
                      [camera.bound_coor.bx, camera.bound_coor.y],
                      [camera.bound_coor.bx, camera.bound_coor.by],
                      [camera.bound_coor.x, camera.bound_coor.by]];
}

function cvs_update_bound() {
  $canvas_bound.css('width', Math.min(camera.bound_coor.bx, world.bound[0]) * BLOCK_SIZE).css('height', Math.min(camera.bound_coor.by, world.bound[1]) * BLOCK_SIZE);
}

var _roadsShown = {};
function cvs_draw_all_roads() {
  let start = new Date();
  cvs_update_bound();
  // $canvas_container.find('road:not(.irremovable)').remove();
  // $canvas_container.find('node.building').remove();
  Object.keys(_roadsShown).forEach(r => {
    if (!world.roads[r]) {
      _roadsShown[r].remove();
      delete _roadsShown[r];
    }
  });

  Object.values(world.roads).forEach(r => {
    if (geometric.lineIntersectsPolygon([world.nodes[r.node1].coor, world.nodes[r.node2].coor], camera.bound_coor_rect) ||
      (geometric.pointInPolygon(world.nodes[r.node1].coor, camera.bound_coor_rect) && geometric.pointInPolygon(world.nodes[r.node2].coor, camera.bound_coor_rect))) {
      if (!_roadsShown[r.id])
        _roadsShown[r.id] = cvs_draw_road(r);
      else if (_cvs_request_road_callback)
        _roadsShown[r.id].css('cursor', 'pointer').click(() => {
          _cvs_request_road_callback(r);
        });
    } else if (_roadsShown[r.id]) {
      _roadsShown[r.id].remove();
      delete _roadsShown[r.id];
    }
  });
  // console.log(`cvs_draw_all_roads() in ${new Date() - start}ms`);
}
var _skip_drawing_nodes = true;
function cvs_draw_all_nodes() {
  let start = new Date();
  cvs_update_bound();
  $canvas_container.find('node:not(.building):not(.irremovable)').remove();

  if (_skip_drawing_nodes) return;
  Object.values(world.nodes).forEach(n => {
    if (geometric.pointInPolygon(n.coor, camera.bound_coor_rect))
      cvs_draw_node(n)
  });
  // console.log(`cvs_draw_all_nodes() in ${new Date() - start}ms`);
}

let _carsShown = {};
function cvs_draw_all_cars() {
  let start = new Date();
  cvs_update_bound();
  Object.values(world.cars).forEach(c => {
    let coor = c.coor;
    if (geometric.pointInPolygon(coor, camera.bound_coor_rect)) {
      if (!_carsShown[c.id])
        _carsShown[c.id] = cvs_draw_car(c, coor);
    } else if (_carsShown[c.id]) {
      _carsShown[c.id].remove();
      delete _carsShown[c.id];
    }
  });
  // console.log(`cvs_draw_all_cars() in ${new Date() - start}ms`);
}

function cvs_place_active_hover_node(coor) {
  let node = $(`<node class="active placed-hover hover irremovable" style="
    left: ${BLOCK_SIZE * (coor[0]) + OFFSET_X - HOVER_NODE_RADIUS - HOVER_NODE_BORDER}px;
    top: ${BLOCK_SIZE * (coor[1]) + OFFSET_Y - HOVER_NODE_RADIUS - HOVER_NODE_BORDER}px;
    width: ${HOVER_NODE_RADIUS * 2}px;
    height: ${HOVER_NODE_RADIUS * 2}px;
    border: ${HOVER_NODE_BORDER}px solid rgba(0, 0, 0, 0.3);
    background: white;
  "/>`);
  $canvas_container.append(node);
  return node;
}

var _cvs_request_hover_drawback = null;

function cvs_draw_hover_node() {
  $('#hoverNode').remove();
  $('.hover:not(.placed-hover)').css('cursor', '').removeClass('hover').removeClass('active');

  if (!drawHoverNode || !mouseCoor || _cvs_request_road_callback) return;

  let node = Object.values(world.nodes).filter(a => a.coor[0] == mouseCoor[0] && a.coor[1] == mouseCoor[1])[0];
  if (node) {
    let $node = $('#' + node.id).addClass('hover');
    $node.css('cursor', 'pointer').off('click').click(() => {
      if (_cvs_request_hover_drawback) {
        _cvs_request_hover_drawback(node);
      }
    });
  } else {
    let $node = $(`<node id="hoverNode" class="irremovable" style="
    left: ${BLOCK_SIZE * (mouseCoor[0]) + OFFSET_X - HOVER_NODE_RADIUS - HOVER_NODE_BORDER}px;
    top: ${BLOCK_SIZE * (mouseCoor[1]) + OFFSET_Y - HOVER_NODE_RADIUS - HOVER_NODE_BORDER}px;
    width: ${HOVER_NODE_RADIUS * 2}px;
    height: ${HOVER_NODE_RADIUS * 2}px;
    border: ${HOVER_NODE_BORDER}px solid rgba(0, 0, 0, 0.3);
    background: white;
    "/>`);
    if (_cvs_request_hover_drawback) {
      $node.css('cursor', 'pointer').click(() => {
        _cvs_request_hover_drawback(mouseCoor);
      });
    }
    $canvas_container.append($node);
  }

}

var mouseCoor = null;
var drawHoverNode = true;
var _mousemoveCallback = null;

$canvas.mousemove((e) => {
  let x = (e.pageX + $canvas.scrollLeft()) / _ui_current_zoom - OFFSET_X;
  let y = (e.pageY + $canvas.scrollTop()) / _ui_current_zoom - OFFSET_Y;

  if (Math.abs(x - (Math.round(x / BLOCK_SIZE) * BLOCK_SIZE)) > CLIP_COEF * HOVER_NODE_RADIUS + HOVER_NODE_BORDER ||
      Math.abs(y - (Math.round(y / BLOCK_SIZE) * BLOCK_SIZE)) % BLOCK_SIZE > HOVER_NODE_RADIUS + HOVER_NODE_BORDER) {
    mouseCoor = null;
  } else {
    mouseCoor = [Math.max(0, Math.min(world.bound[0], Math.round(x / BLOCK_SIZE))),
    Math.max(0, Math.min(world.bound[1], Math.round(y / BLOCK_SIZE)))];
  }

  if ($tooltip.is(':visible')) {
    $tooltip[0].style.top = (e.clientY + 20) + 'px';
    $tooltip[0].style.left = (e.clientX + 20) + 'px';
  }

  if (_mousemoveCallback) _mousemoveCallback(mouseCoor);
  cvs_draw_hover_node();
});

function cvs_repaint() {
  if (window.repaintInProcess) return;
  window.repaintInProcess = true;
  let start = new Date();
  cvs_update_camera();
  cvs_draw_all_roads();
  cvs_draw_all_nodes();
  cvs_draw_all_cars();
  running_stat.uiTime = new Date() - start;
  console.log(`cvs_repaint() in ${running_stat.uiTime}ms`)
  window.repaintInProcess = false;
}

// for (let x = 0;x < 5;x++) { // las vegas size = 38
//   let lastRow = null;
//   for (let y = 0;y < 5;y++) {
//     let n = create_node([x * 8, y * 8]);
//     if (lastRow) {
//       create_road(lastRow, n, Object.values(TYPES)[Math.floor(Object.values(TYPES).length * Math.random())], Math.random() > 0.9);
//     }
//     if (x > 0) {
//       let lastCol = Object.values(world.nodes).filter(a => a.coor[0] == (x-1) * 8 && a.coor[1] == y * 8)[0];
//       create_road(n, lastCol, Object.values(TYPES)[Math.floor(Object.values(TYPES).length * Math.random())], Math.random() > 0.9);
//     }
//     lastRow = n;
//   }
// }

// sim_precalc();
// sim_spawn_cars();
// sim_precalc();
// sim_start();
function cvs_reinit() {
  Object.values(_carsShown).forEach(c => c.remove());
  _carsShown = {};
  cvs_repaint();
}
$(() => {
  cvs_reinit();
});
