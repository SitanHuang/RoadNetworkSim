let _residentialBuildings = {};
let _commercialBuildings = {};
let _touristBuildings = [];

let _buildings = 0;

function sim_precalc() {
  _residentialBuildings = {};
  _commercialBuildings = {};
  _touristBuildings = [];
  _buildings = 0;
  pathfind_create_graph();

  let start = new Date();

  for (let id in world.roads) {
    let r = world.roads[id];
    r.buildings.forEach((b, i) => {
      let region = building_coor(r, i).map(x => Math.round(x * METERS_PER_UNIT / (Math.random() * 8000 + 1000))).toString();
      _residentialBuildings[region] = _residentialBuildings[region] || [];
      _commercialBuildings[region] = _commercialBuildings[region] || [];
      _buildings++;
      if (b[0] == 'R') _residentialBuildings[region].push({ r: r, b: b });
      else if (b[0] == 'C') _commercialBuildings[region].push({ r: r, b: b });
      else if (b[0] == 'T') _touristBuildings.push({ r: r, b: b });
    });
  }

  _touristBuildings = durstenfeldShuffle(_touristBuildings);

  //console.log(`sim_precalc() in ${new Date() - start}ms`);
  // get cars in every node
  // car speed depend on capacity of next node
  // each car has 1/(# intersections) chance to move intersection
}

var _sim_car_loc_cache = {};

function sim_tick() {
  let start = new Date();
  world.tick = isNaN(world.tick) || world.tick > 1e10 ? 0 : world.tick + 1;
  _sim_car_loc_cache = {};
  for (let id in world.cars) {
    let car = world.cars[id];
    car._oldRoad = car.road;
    car._oldAngle = car.angle;
    let n = car.path[car.path.length - 1];
    let cache = car.loc + '=>' + n;

    if (!_sim_car_loc_cache[cache]) _sim_car_loc_cache[cache] = {};
    _sim_car_loc_cache[cache][car.id] = car;
  }
  for (let id in world.cars) {
    let car = world.cars[id];
    // try {
      car_move(car);
    // } catch (e) {
    //   car_remove(car);
    // }
  }
  running_stat.tickTime = new Date() - start;
  // console.log(`sim_tick() in ${new Date() - start}ms`);
}

var sim_sec_per_cycle = 1;

function sim_start() {
  sim_stop();
  sim_precalc();
  if (Object.keys(world.cars).length == 0) sim_spawn_cars(200);
  if (_buildings == 0) return 'Cannot start simulation without buildings.';
  setTimeout(() => {
    window._cycle = () => {
      let start = new Date();
      if (Math.random() > 0.9) {
        sim_spawn_cars(Math.random() > 0.7 ? 100 : 50);
        sim_precalc();
      }
      sim_tick();
      cvs_draw_all_cars();
      cvs_update_all_cars();
      //console.log(`cycle in ${new Date() - start}ms`);
      ui_stat_update();
      setTimeout(window._cycle, 300);
    };
    window._cycle();
  }, 600);
}
function sim_stop() {
  delete window._cycle;
}

function sim_max_cars() {
  return (_buildings * 3 * 1.2 / 10) | 0;
}

function sim_spawn_cars(max_time) {
  max_time = isNaN(max_time) ? 1000 : max_time;
  let start = new Date();
  let existingCars = Object.values(world.cars).length;
  let cars = 0;
  let lengths = 0;

  let buildingsList = Math.random() > 0.5 ? _residentialBuildings : _commercialBuildings;
  let regions = durstenfeldShuffle(Object.keys(buildingsList));
  if (Math.random() < 0.6)
    do {
      let x = buildingsList[regions[Math.floor(regions.length * Math.random())]];
      if (!x || !x.length) return;
      x = x[Math.floor(x.length * Math.random())];
      let src = building_id(x.r, x.b[2]);
      let coor = parse_id(src);

      let buildingsList2 = Math.random() > 0.5 ? _residentialBuildings : _commercialBuildings;
      let regions2 = durstenfeldShuffle(Object.keys(buildingsList2));
      let dst = buildingsList2[regions2[Math.floor(regions2.length * Math.random())]];
      if (!dst) break;
      dst = dst[dst.length * Math.random() | 0];
      if (!dst) break;
      dst = building_id(dst.r, dst.b[2]);
      let path = pathfind_find(src, dst);
      if (!path.length) break;
      create_car(src, dst, path);
      cars++;
      lengths += path.length;
    } while ((new Date() - start) < max_time * 0.35 && (cars + existingCars) < sim_max_cars());

  if (Math.random() < 0.6)
    do {
      let x = buildingsList[regions[Math.floor(regions.length * Math.random())]];
      if (!x || !x.length) return;
      x = x[Math.floor(x.length * Math.random())];
      let src = building_id(x.r, x.b[2]);
      let coor = parse_id(src);

      let dst = _touristBuildings[Math.floor(_touristBuildings.length * Math.random())];
      if (!dst) break;
      dst = building_id(dst.r, dst.b[2]);
      let path = pathfind_find(src, dst);
      if (!path.length) break;
      create_car(src, dst, path);
      cars++;
      lengths += path.length;
    } while ((new Date() - start) < max_time * 0.45 && (cars + existingCars) < sim_max_cars());

  let i = 0;
  for (let region = regions[i];i < regions.length;i++) {
    if ((new Date() - start) > max_time || (cars + existingCars) > sim_max_cars()) break;
    _residentialBuildings[region].forEach(x => {
      if ((new Date() - start) > max_time * 0.4 || (cars + existingCars) > sim_max_cars()) return;
      let src = building_id(x.r, x.b[2]);
      let coor = parse_id(src);

      let dst = (Math.random() < 0.9 ? _commercialBuildings[region] : _residentialBuildings[region]);
      if (!dst) return;
      dst = dst[dst.length * Math.random() | 0];
      if (!dst) return;
      dst = building_id(dst.r, dst.b[2]);
      let path = pathfind_find(src, dst);
      if (!path.length) return;
      create_car(src, dst, path);
      cars++;
      lengths += path.length;
    });
    _commercialBuildings[region].forEach(x => {
      if ((new Date() - start) > max_time * 0.4 || (cars + existingCars) > sim_max_cars()) return;
      let src = building_id(x.r, x.b[2]);
      let coor = parse_id(src);

      let dst = (Math.random() < 0.9 ? _residentialBuildings[region] : _commercialBuildings[region]);
      if (!dst) return;
      dst = dst[dst.length * Math.random() | 0];
      if (!dst) return;
      dst = building_id(dst.r, dst.b[2]);
      let path = pathfind_find(src, dst);
      if (!path.length) return;
      create_car(src, dst, path);
      cars++;
      lengths += path.length;
    });
  }
  console.log(`sim_spawn_cars() ${cars} cars and ${Math.round(lengths / cars * METERS_PER_UNIT / 1000 * 10) / 10}km avg trip in ${new Date() - start}ms`);
}
