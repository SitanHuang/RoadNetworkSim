function create_node(coor) {
  let node = {
    id: `${coor[0]}-${coor[1]}-${(Math.random()).toString().slice(2, 5)}`,
    coor: coor,
    start: [], // roads that start with this node
    end: [], // roads that end with this node
    intersection: { type: 'bypass' }
  };

  world.bound[0] = Math.max(world.bound[0], coor[0] + 15);
  world.bound[1] = Math.max(world.bound[1], coor[1] + 15);

  world.nodes[node.id] = node;
  return node;
}

function node_recalc_intersection(node) {
  if (node.start.length <= 2 && node.end.length <= 2) {
    node.intersection = { type: 'bypass' };
  } else if ((node.start.length <= 3 && node.end.length <= 2) || (node.start.length <= 2 && node.end.length <= 3)) { // one way road connect to T
    node.intersection = { type: 'yield' };
  } else if (node.start.length <= 3 && node.end.length <= 3) { // two way road connect to T
    node.intersection = { type: 'stop' };
  } else {
    node.intersection = { type: 'light'  };
  }
}

function node_intersection_passable(node, road) {
  node = node.id ? node : world.nodes[node];
  road = road.id ? road : world.roads[road];
  let i = node.intersection;
  if (i.type == 'bypass') return 1;
  else if (i.type == 'yield') return 0.5;
  else if (i.type == 'stop') return 0.1;
  else {
    let every = i.type == 'stop' ? 1 : 10;
    let i2;
    node.end.forEach((x, i3) => {
      if (x == road.id) i2 = i3;
    });
    return Math.floor(world.tick / every) % (node.end.length) == i2 ? 1 : 0;
  }
}
