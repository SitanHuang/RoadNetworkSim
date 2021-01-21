const TYPES = {
  L1: { // driveway
    name: 'Driveway',
    speed: 30,
    lanes: 1,
    height: 1,
    border: 0,
    buildings: {
      R: 0.95,
      C: 0.05,
    },
    css_class: 'l1'
  },
  L2: { // collector
    name: 'Street',
    speed: 60,
    lanes: 2,
    height: 2,
    border: 0,
    buildings: {
      R: 0.65,
      C: 0.3,
      T: 0.02
    },
    css_class: 'l2'
  },
  L3: { // boulevard
    name: 'Boulevard',
    speed: 60,
    lanes: 4,
    height: 2,
    border: 0.7,
    buildings: {
      R: 0.3,
      C: 0.65,
      T: 0.05
    },
    css_class: 'l3'
  },
  L4: { // highway
    name: 'Highway',
    speed: 80,
    lanes: 6,
    height: 4,
    border: 0,
    buildings: {
      R: 0.2,
      C: 0.75,
      T: 0.05,
    },
    css_class: 'l4'
  },
  L40: { // highway ramp
    name: 'Ramp',
    speed: 120,
    lanes: 1,
    height: 2,
    border: 1,
    buildings: {},
    css_class: 'l4'
  },
  L41: { // segregated highway
    name: 'Freeway',
    speed: 120,
    lanes: 6,
    height: 4,
    border: 1,
    buildings: {},
    css_class: 'l4'
  }
};

const BUILDINGS = {
  R: {
    name: 'Residential',
    radius: 1,
    color: '#8aff8a'
  },
  C: {
    name: 'Commercial',
    radius: 1,
    color: 'blue'
  },
  T: {
    name: 'Landmarks',
    radius: 3,
    color: 'red'
  }
}
