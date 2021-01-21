function ui_road_window(btn) {
  ui_stop_sim();
  let html = `
  <label for="checkbox-one-way">One Way</label>
  <input type="checkbox" name="checkbox-one-way" id="checkbox-one-way"><divider>
  `;
  Object.keys(TYPES).sort((a, b) => a.localeCompare(b)).forEach((x, i) => {
    let t = TYPES[x];
    html += `
    <div data-key="${i + 1}" class="ui-button ui-corner-all ui-widget" style="display: block" onclick="ui_road_select('${x}')">
    <h4>${t.name}</h4>
    <table style="width: 100%">
    <tr>
    <th>Speed
    <td>${t.speed} km/h
    <tr>
    <th>Lanes
    <td>${t.lanes}
    <tr>
    <th>Buildings
    <td>${Object.keys(t.buildings)}
    </table>
    <clear/>
    </div>
    `;
  });
  $('#roadsDialog')
    .html(html)
    .dialog({
      modal: false,
      height: Math.max(300, window.innerHeight - 40),
      width: 300,
      close: function () {
        btn.previousElementSibling.style.display = "inline-block";
        _cvs_request_hover_drawback = null;
        _mousemoveCallback = null;
        if (window._add_road_mock_road) window._add_road_mock_road.remove();
        $(btn).removeClass('active');
        $("node.active.hover").remove();
        cvs_draw_hover_node();
        if (!sim_precalc())
          ui_start_sim(btn.previousElementSibling);
      },
      position: { my: "right top", at: "right-20px top+20px", of: window },
      buttons: {
        Cancel: function () {
          $(this).dialog("close");
        }
      }
    });
  $('#roadsDialog').find('input[type="checkbox"]').checkboxradio();
}
function ui_road_select(type) {
  $("#roadsDialog").parent().hide();
  _cvs_request_hover_drawback = (coor) => {
    let node = coor.id ? coor : create_node(coor);
    coor = coor.id ? coor.coor : coor;
    let hover1 = cvs_place_active_hover_node(coor);
    _mousemoveCallback = (mouseCoor) => {
      if (window._add_road_mock_road) window._add_road_mock_road.remove();
      if (mouseCoor) {
        let length = geometric.lineLength([coor, mouseCoor]);
        $tooltip.show().text(`${Math.round(METERS_PER_UNIT * length / 1000 * 100) / 100}km`);
        window._add_road_mock_road = cvs_draw_mock_road([coor, mouseCoor], TYPES[type]);
      }
    };
    _cvs_request_hover_drawback = (coor2) => {
      if (coor.toString() == coor2.toString()) return;
      let node2 = coor2.id ? coor2 : create_node(coor2);
      create_road(node, node2, TYPES[type], $('#checkbox-one-way')[0].checked);
      sim_precalc();
      if (window._add_road_mock_road) window._add_road_mock_road.remove();
      hover1.remove();
      $tooltip.hide();
      _mousemoveCallback = null;
      _cvs_request_hover_drawback = null;
      $("#roadsDialog").dialog("close");
      cvs_repaint();
    };
    cvs_draw_hover_node();
  };
}
function ui_delete_road() {
  ui_stop_sim();
  _cvs_request_road_callback = (r) => {
    _cvs_request_road_callback = null;
    delete_road(r);
    world.cars = {};
    reinit_game();
  };
  cvs_repaint();
}
