import './style.scss';

// import EarthWithSatellites from './Earth';
import {ThreeSimulation} from './Sim';
import { Satellite } from './Satellite';


window.addEventListener('DOMContentLoaded', () => {
    const sim = new ThreeSimulation();

    const sat = new Satellite();
    sat.fromTLE(`ISS (ZARYA)
1 25544U 98067A   21197.51736111  .00000913  00000-0  23866-4 0  9996
2 25544  51.6443  89.0000 0002866  93.0000  17.0000 15.48900079286168`);

    sim.addSatellite(sat);
    sim.setTimeSpeed(1);

    // new EarthWithSatellites();
});
