const $rightStat = $('#rightStat');
var running_stat = { tickTime: 0, uiTime: 0, tickRate: 300 };

$('#rightStat').mouseenter(ui_stat_update)

function ui_stat_update() {
  let html = `
    var: ${running_stat.tickTime}ms<br>
    fps: ${Math.round(100 * 1000 / running_stat.tickRate) / 100}<br>
    ui: &nbsp;${running_stat.uiTime}ms<br/>
    ${Object.values(world.cars).length} cars
    <br>`;
  if ($('#rightStat:hover').length) {
    html = html.replace('<br/>', '<br><br>').replace(' cars', ` / ${sim_max_cars()} cars`);
    html += `<div class="hidden">
    ${Object.values(world.roads).length} roads<br>${Object.values(world.nodes).length} nodes<br>
    ${_buildings} buildings<br><br>
    map: ${Math.round(world.bound[0] * METERS_PER_UNIT / 1000 * 10) / 10}km x ${Math.round(world.bound[1] * METERS_PER_UNIT / 1000 * 10) / 10}km<br>
    cam: ${Math.round($canvas.outerWidth() / _ui_current_zoom / BLOCK_SIZE * METERS_PER_UNIT / 1000 * 10) / 10}km x ${Math.round($canvas.outerHeight() / _ui_current_zoom / BLOCK_SIZE * METERS_PER_UNIT / 1000 * 10) / 10}km<br>
    </div>`;
  }
  $('#rightStat').html(html);
}

ui_stat_update();
