var pathfind_graph = null;

function pathfind_find(src, dst) {
  let a = ngraphPath.aStar(pathfind_graph, {oriented: true}).find(src, dst).map(x => x.id);
  a.length = Math.max(0, a.length - 1);
  return a;
}

function pathfind_create_graph() {
  let start = new Date();

  pathfind_graph = createGraph();

  let roads = Object.values(world.roads);
  let buildings = 0;
  let links = 0;
  roads.forEach(r => {
    let n1 = world.nodes[r.node1];
    let n2 = world.nodes[r.node2];
    if (r.buildings.length) {
      pathfind_graph.addLink(n1.id, building_id(r, 0), {weight: r.type.speed * r.type.lanes}); links++;
      for (let i = 0;i < r.buildings.length;i++) {
        buildings++;
        let b = r.buildings[i];
        let b2 = r.buildings[i + 1];
        if (!b2) {
          pathfind_graph.addLink(building_id(r, i), n2.id, {weight: r.type.speed * r.type.lanes}); links++;
          break;
        }
        pathfind_graph.addLink(building_id(r, i), building_id(r, i + 1), {weight: r.type.speed * r.type.lanes}); links++;
      }
      if (!r.one_way) {
        pathfind_graph.addLink(n2.id, building_id(r, r.buildings.length - 1), {weight: r.type.speed * r.type.lanes}); links++;
        for (let i = r.buildings.length - 1;i >= 0;i--) {
          let b = r.buildings[i];
          let b2 = r.buildings[i - 1];
          if (!b2) {
            pathfind_graph.addLink(building_id(r, i), n1.id, {weight: r.type.speed * r.type.lanes}); links++;
            break;
          }
          pathfind_graph.addLink(building_id(r, i), building_id(r, i - 1), {weight: r.type.speed * r.type.lanes}); links++;
        }
      }
    } else {
      pathfind_graph.addLink(n1.id, n2.id, {weight: r.type.speed * r.type.lanes / r.length});
      if (!r.one_way)
        pathfind_graph.addLink(n2.id, n1.id, {weight: r.type.speed * r.type.lanes / r.length});
    }
  });
  console.log(`pathfind_create_graph: ${roads.length} roads, ${buildings} buildings, ${links} links in ${(new Date() - start)}ms`)
}
