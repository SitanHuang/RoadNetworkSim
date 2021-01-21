function create_car(src, dst, path) {
  src = src.id? src.id : src;
  dst = dst.id? dst.id : dst;

  if (m = src.match(/^(\d+)-(\d+)-\d+$/)) { // node
    throw "Cars can't start at node";
  }

  let car = {
    id: (Math.random()).toString().slice(2),
    src: src,
    dst: dst,
    path: path,
    road: src.replace(/#.+$/, ''),
    loc: src,
    angle: 0,
    speed: 0,
    targetSpeed: 0,
    progress: 0,
    coor: parse_id(src)
  };

  world.cars[car.id] = car;
  return car;
}

function car_coor(car) {
  let loc = car.loc;
  return parse_id(loc);
}

function car_remove(car) {
  delete world.cars[car.id];
  if (_carsShown[car.id]) {
    _carsShown[car.id].remove();
    delete _carsShown[car.id];
  }
}

function car_in_front(car) {
  let carsInFront = 0;
  let nearestCar = Infinity;

  let n = car.path[car.path.length - 1];
  let n2 = car.path[car.path.length - 2];
  let capacity = world.roads[car.road].type.lanes;
  if (world.roads[car.road].one_way) capacity /= 2;

  if (n) {
    let cache = _sim_car_loc_cache[car.loc + '=>' + n];
    if (cache) {
      Object.values(cache).forEach(x => {
        if (x.id == car.id) return;
        let length = x.progress - car.progress;
        if (length > 100 || length <= 0) return;
        carsInFront++;
        nearestCar = Math.min(length, nearestCar);
      });
      if (n2 && carsInFront == 0) {
        let cache2 = _sim_car_loc_cache[n + '=>' + n2];
        if (cache2) {
          Object.values(cache2).forEach(x => {
            let length = x.progress + car.remainingLength;
            if (length > 100 || length <= 0) return;
            capacity = world.roads[x.road].type.lanes;
            if (world.roads[x.road].one_way) capacity /= 2;
            carsInFront++;
            nearestCar = Math.min(length, nearestCar);
          });
        }
      }
    }
  }


  return [carsInFront, nearestCar, capacity];
}

function car_calc_speed(car) {
  let road = world.roads[car.road];
  let base = road.type.speed * 1000 / 60 / 60 * sim_sec_per_cycle + Math.random() * 2;
  let n = car.path[car.path.length - 1];
  let intersection_reduction = 1;

  let [carsInFront, nearestCar, capacity] = car_in_front(car);

  if (car.remainingLength < 25) {
    if (n.match(/^\d+-\d+-\d+$/))
      intersection_reduction = node_intersection_passable(n, road);

    if (intersection_reduction > 0) base *= intersection_reduction;
    else {
      nearestCar = Math.min(nearestCar, Math.max(0, car.remainingLength - 10));
      carsInFront = capacity;
    }
  }


  car.targetSpeed = base;

  if (carsInFront >= capacity) {
    nearestCar = Math.max(nearestCar - 5, 0);
    if (nearestCar < 5) {
      car.targetSpeed = car.speed = 0;
    } else {
      let mps = nearestCar / 3; // max m/s given safe 3 second distance
      let kmph = mps * 3.6 * sim_sec_per_cycle;
      car.targetSpeed = Math.min(kmph, car.targetSpeed);
      // speed /= Math.min(1, Math.pow(carsInFront / capacity, 2));
    }
  }

  if (car.speed > car.targetSpeed) car.speed = car.targetSpeed;
  else car.speed += 2 * sim_sec_per_cycle;

  return Math.min(car.speed, car.targetSpeed);
}

function car_move(car, residualSpeed) {

  let nextId = car.path[car.path.length - 1];
  let nextCoor = parse_id(nextId);
  let length = geometric.lineLength([car.coor, nextCoor]) * METERS_PER_UNIT;
  car.remainingLength = length;
  car.angle = Math.round(geometric.lineAngle([car.coor, nextCoor]));
  // car.length = geometric.lineLength([parse_id(car.loc), nextCoor]) * METERS_PER_UNIT;

  let speed = residualSpeed ? residualSpeed : car_calc_speed(car);

  if (speed >= length) {
    let m, _r;
    let next2 = car.path[car.path.length - 2];
    if (m = nextId.match(/^(\d+-\d+-\d+=\d+-\d+-\d+)(#\d+\|\d+){0,1}$/))
      car.road = m[1];
    if (nextId.match(/^\d+-\d+-\d+$/) && (m = next2.match(/^(\d+-\d+-\d+=\d+-\d+-\d+)(#\d+\|\d+){0,1}$/)))
      car.road = m[1];
    if (next2 && (m = next2.match(/^\d+-\d+-\d+$/)) && ((_r = world.roads[nextId + '=' + next2]) || (_r = world.roads[next2 + '=' + nextId])))
      car.road = _r.id;

    let cache = car.loc + '=>' + car.path[car.path.length - 1];
    if (_sim_car_loc_cache[cache])
      delete _sim_car_loc_cache[cache][car.id];

    car.coor = nextCoor;
    car.loc = nextId;
    car.path.length--;

    car.progress = 0;

    cache = car.loc + '=>' + car.path[car.path.length - 1];
    if (!_sim_car_loc_cache[cache]) _sim_car_loc_cache[cache] = {};
    _sim_car_loc_cache[cache][car.id] = car;

    if (car.loc == car.dst || !world.roads[car.road]) {
      car_remove(car);
      return;
    }

    if (speed > length) { // if has residual, move again
      let newSpeed = car_calc_speed(car);
      car_move(car, (speed - length) * (newSpeed / speed));
    }
  } else {
    let interp = geometric.lineInterpolate([car.coor, nextCoor]);
    car.progress += speed;
    car.coor = interp(speed / length);
  }

  // if (_carsShown[car.id]) cvs_car_pos_css(_carsShown[car.id], car.coor, world.roads[car.road].type.css_class);
}
