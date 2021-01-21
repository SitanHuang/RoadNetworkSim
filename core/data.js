var world = {roads: {}, nodes: {}, cars: {}, bound: [80, 50], tick: 0};

function save_game() {
  ui_stop_sim(document.getElementById('playpause'));
  localStorage.save1 = JSON.stringify(world);
}

function reinit_game() {
  _residentialBuildings = {};
  _commercialBuildings = {};
  _touristBuildings = [];
  sim_precalc();
  cvs_reinit();
}

function load_game() {
  ui_stop_sim(document.getElementById('playpause'));
  if (localStorage.save1)
    world = JSON.parse(localStorage.save1);
  reinit_game();
}
