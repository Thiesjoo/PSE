import { Satellite } from "./Satellite";
import { EARTH_RADIUS_KM } from "./common/constants";
import ThreeGlobe from "three-globe";

type node = {sat: Satellite,
            connections: Satellite[],
            fScore: number,
            gScore: number,
            hScore: number,
            parent: node | null}

export class Graph{
    private globe!: ThreeGlobe;
    public adjList: node[] = [];

    constructor(globe: ThreeGlobe){
        this.globe = globe;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    private calculateDistance(sat1: Satellite, sat2: Satellite){
        const position1 = sat1.realPosition
        const position2 = sat2.realPosition

        const lat1Rad = this.toRadians(position1.lat);
        const lon1Rad = this.toRadians(position1.lng);
        const lat2Rad = this.toRadians(position2.lat);
        const lon2Rad = this.toRadians(position2.lng);

        // Haversine formula
        const dLat = lat2Rad - lat1Rad;
        const dLon = lon2Rad - lon1Rad;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        // Radius of Earth in kilometers. Use 3956 for miles
        const R = 6371.0;
        const distance = R * c;

        return distance;
    }

    makeGraph(sats: Satellite[]){
        for (const sat of sats){
            const satData: node = {sat: sat, connections: [], fScore: Infinity, gScore: Infinity, hScore: Infinity, parent: null};
            this.adjList.push(satData)
            for (const compareSat of sats){
                const diff = this.calculateDistance(sat, compareSat);
                if (diff < 550){
                    satData.connections.push(compareSat);
                }
            }
        }
    }

    findNode(sat: Satellite){
        return this.adjList.find((node) => node.sat === sat)
    }

    popLowestScore(nodeList: node[]){
        let lowestNum = Infinity
        let lowestNode = null;
        for (const node of nodeList){
            if (node.fScore < lowestNum){
                lowestNum = node.fScore
                lowestNode = node;
            }
        }
        if (lowestNode){
            const index = nodeList.indexOf(lowestNode);
            nodeList.splice(index, 1);
        }
        return lowestNode;
    }

    findPath(sat1: Satellite, sat2: Satellite){
        const startNode = this.findNode(sat1);
        const goalNode = this.findNode(sat2);
        if (!startNode || !goalNode){
            return
        }

        const openList = [startNode]
        const closedList: node[] = []

        startNode.fScore = 0;
        startNode.gScore = 0;
        startNode.hScore = 0;

        while (openList.length > 0){
            let current = this.popLowestScore(openList);
            if (!current) return

            closedList.push(current);

            if (current === goalNode){
                const path = []
                while (current?.parent != null){
                    path.push(current);
                    current = current.parent
                }
                return path;
            }

            for (const sat of current.connections){
                const connectingNode = this.findNode(sat)
                if (!connectingNode) return
                if (closedList.includes(connectingNode)){
                    continue;
                }
                const newGScore = current.gScore + this.calculateDistance(current.sat, connectingNode.sat);
                const newHScore = this.calculateDistance(connectingNode.sat, goalNode.sat);
                const newFScore = newGScore + newHScore;
                if (!openList.includes(connectingNode) || newFScore < connectingNode.fScore){
                    connectingNode.gScore = newGScore;
                    connectingNode.hScore = newHScore;
                    connectingNode.fScore = newFScore;
                    connectingNode.parent = current;
                    if (!openList.includes(connectingNode)){
                        openList.push(connectingNode);
                    }
                }
            }
        }
    }
}