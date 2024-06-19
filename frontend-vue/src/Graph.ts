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

    private calculateDistance(sat1: Satellite, sat2: Satellite){
        // const position1 = sat1.realPosition
        // const position2 = sat2.realPosition

        // const dLat = position1.lat - position2.lat
        // const dLng = position1.lng - position2.lng

        // const distance = Math.sqrt(dLat * dLat + dLng * dLng)
        // return distance

        const {lat: lat1, lng: lng1} = sat1.realPosition 
        const {lat: lat2, lng: lng2} = sat2.realPosition 
    
        const distance = Math.acos( 
            Math.sin(lat1) * Math.sin(lat2) + 
            Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1) 
            ) * EARTH_RADIUS_KM 
    
        return distance
    }

    makeGraph(sats: Satellite[]){
        for (const sat of sats){
            const satData: node = {sat: sat, connections: [], fScore: Infinity, gScore: Infinity, hScore: Infinity, parent: null};
            this.adjList.push(satData)
            for (const compareSat of sats){
                const diff = this.calculateDistance(sat, compareSat);
                if (diff < 1000){
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