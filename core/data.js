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
  load_world_ui();
}

function load_world_ui() {
  if (!(world.ui && world.ui._ui_current_zoom && world.ui.scrollLeft && world.ui.scrollTop)) return;
  ui_zoom(world.ui._ui_current_zoom, true);
  cvs_repaint();
  cvs_update_camera(world.ui.scrollLeft, world.ui.scrollLeft);
  cvs_update_bound();
  $canvas.scrollTop(world.ui.scrollTop).scrollLeft(world.ui.scrollLeft);
  cvs_update_camera();
  cvs_update_bound();
  cvs_repaint();
  dialog_load_game_stat();
}

function dialog_load_game_stat() {
  sim_precalc();
  $("#infoDialog")
    .text(`Loaded ${Object.values(world.roads).length} roads, ${Object.values(world.nodes).length} nodes, ${_buildings} buildings, and ${Object.values(world.cars).length} cars`)
    .dialog({ modal: true, buttons: { Ok: function() { $(this).dialog( "close" ); } } });
}

function export_game() {
  function exportToJsonFile(jsonData) {
    let dataStr = JSON.stringify(jsonData);
    let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    let exportFileDefaultName = 'data.json';

    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
  exportToJsonFile(world);
}

function import_game() {
  ui_stop_sim(document.getElementById('playpause'));
  $("#file-upload-button").off().change(function(event){
    var uploadedFile = event.target.files[0];
    if (uploadedFile) {
      var readFile = new FileReader();
      readFile.onload = function(e) {
        var contents = e.target.result;
        try {
          world = JSON.parse(contents);
          reinit_game();
          load_world_ui();
        } catch (e) {
          $("#errorDialog")
            .text("File corrupted.")
            .dialog({ modal: true, buttons: { Ok: function() { $(this).dialog( "close" ); } } });
        }
        alert_data(json);

      };
      readFile.readAsText(uploadedFile);
    } else {
      $("#errorDialog")
        .text("Failed to load file.")
        .dialog({ modal: true, buttons: { Ok: function() { $(this).dialog( "close" ); } } });
    }
  }).click();

}
