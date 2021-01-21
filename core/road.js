METERS_PER_UNIT = 75;

function delete_road(road) {
  road = road.id ? road : world.roads[road];
  let node1 = world.nodes[road.node1];
  let node2 = world.nodes[road.node2];
  if (road.one_way) {
    if (node1.start.length <= 1 && node1.end.length <= 0) delete world.nodes[road.node1];
    if (node2.end.length <= 1 && node2.start.length <= 0) delete world.nodes[road.node2];
    node1.start = node1.start.filter(x => x != road.id);
    node2.end = node2.end.filter(x => x != road.id);
  } else {
    if (node1.start.length <= 1 && node1.end.length <= 1) delete world.nodes[road.node1];
    if (node2.start.length <= 1 && node2.end.length <= 1) delete world.nodes[road.node2];
    node1.start = node1.start.filter(x => x != road.id);
    node1.end = node1.end.filter(x => x != road.id);
    node2.start = node2.start.filter(x => x != road.id);
    node2.end = node2.end.filter(x => x != road.id);
  }
  node_recalc_intersection(node1);
  node_recalc_intersection(node2);
  delete world.roads[road.id];

}

function create_road(node1, node2, type, one_way) {
  let road = {
    id: `${node1.id}=${node2.id}`,
    node1: node1.id,
    node2: node2.id,
    type: type,
    buildings: [],
    one_way: one_way
  };

  node1.start.push(road.id);
  node2.end.push(road.id);
  if (!one_way) {
    node1.end.push(road.id);
    node2.start.push(road.id);
  }
  node_recalc_intersection(node1);
  node_recalc_intersection(node2);

  let line = [world.nodes[node1.id].coor, world.nodes[node2.id].coor];
  road.length = geometric.lineLength(line);

  // TODO: check if allowed to build
  let buildingTypes = Object.getOwnPropertyNames(type.buildings);
  if (buildingTypes.length) {
    let buildings = road.length;
    for (let i = 1;i < buildings;i++) {
      WHILE: while (true) {
        for (let j = 0;j < buildingTypes.length;j++) {
          if (Math.random() < type.buildings[buildingTypes[j]]) {
            road.buildings.push([buildingTypes[j], i / buildings, road.buildings.length]); // TODO: build based on road stats
            break WHILE;
          }
        }
      }
    }
  }
  world.roads[road.id] = road;
  return road;
}

function building_id(road, i) {
  return `${road.id}#${i + 1}|${road.buildings.length}`;
}

function building_coor(road, i) {
  let interpolator = geometric.lineInterpolate([world.nodes[road.node1].coor, world.nodes[road.node2].coor]);
  return interpolator((i + 1) / road.buildings.length);
}

function get_road_from_building_id(bid) {
  let m = bid.match(/^(\d+-\d+-\d+=\d+-\d+-\d+)#\d+\|\d+$/);
  return world.roads[m[1]];
}

function parse_id(id) {
  let m;
  if (m = id.match(/^(\d+)-(\d+)-\d+$/)) { // node
    return [parseInt(m[1]), parseInt(m[2])];
  }
  if (m = id.match(/^(\d+)-(\d+)-\d+=(\d+)-(\d+)-\d+#(\d+)\|(\d+)$/)) { // building node
    let coor1 = [parseInt(m[1]), parseInt(m[2])];
    let coor2 = [parseInt(m[3]), parseInt(m[4])];
    let interpolator = geometric.lineInterpolate([coor1, coor2]);
    return interpolator(parseInt(m[5]) / (parseInt(m[6]) + 1));
  }
  if (m = id.match(/^(\d+)-(\d+)-\d+=(\d+)-(\d+)-\d+$/)) { // road
    let coor1 = [parseInt(m[1]), parseInt(m[2])];
    let coor2 = [parseInt(m[3]), parseInt(m[4])];
    return [coor1, coor2];
  }
}
