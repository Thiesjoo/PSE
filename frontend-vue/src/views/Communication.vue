<script setup
        lang="ts">
        import { Satellite, polar2Cartesian } from '@/Satellite'
        import { ThreeSimulation } from '@/Sim'
        import LeftInfoBlock from '@/components/LeftInfoBlock.vue'
        import { Ref, ref, watch } from 'vue'
        import SpeedButtons from '@/components/SpeedButtons.vue'
        import { Graph } from '@/Graph'
        import { SatManager, Filter } from '@/common/sat-manager'
        import { AllSatLinks, SatLinks } from '@/SatLinks'
        import { geoCoords } from '@/common/utils'
        import { useI18n } from 'vue-i18n'
        import MultipleTabs from '@/components/MultipleTabs.vue'

        const { t } = useI18n()

        const props = defineProps<{
            simulation: ThreeSimulation
        }>();


        const graph = new Graph(props.simulation.globe)
        const all = new AllSatLinks(props.simulation.scene)
        props.simulation.addAllSatLinks(all)

        const manager = new SatManager(props.simulation)
        await manager.init()

        const filter: Filter = {
            name: 'Starlink',
            selected: true,
            min_launch_year: 1900,
            max_launch_year: 3000
        }
        manager.selectNone()
        manager.currentFilters.push(filter)
        manager.updateSatellites()

        props.simulation.disableSatClicking();



        const firstCoords: Ref<geoCoords | undefined> = ref(undefined)
        const secondCoords: Ref<geoCoords | undefined> = ref(undefined);
        const tabForConnections = 2;
        const tabForFirstCoords = 3;
        const tabForSecondCoords = 4;
        const tabForPath = 5;




        const currentTab = ref(1);

        function tabInfoUpdate(tab: number) {
            all.hideConnections = true;
            all.setPath([])

            if (tab === tabForConnections) {
                makeGraph()
                all.hideConnections = false;
            } else if (tab === tabForFirstCoords) {
                if (firstCoords.value) {
                    props.simulation.removeMarker(firstCoords.value)
                }
                if (secondCoords.value) {
                    props.simulation.removeMarker(secondCoords.value)
                }
                firstCoords.value = undefined
                secondCoords.value = undefined
            } else if (tab === tabForSecondCoords) {
                // TODO: Stop navigating to second page if coords not selected.
                if(secondCoords.value) {
                    props.simulation.removeMarker(secondCoords.value)
                }
                secondCoords.value = undefined
            } else if (tab === tabForPath) {
                findPath()
            }
        }



        props.simulation.addEventListener('earthClicked', (coords) => {
            if (coords) {
                if (currentTab.value === tabForFirstCoords) {
                    if (firstCoords.value) {
                        props.simulation.removeMarker(firstCoords.value)
                    }
                    firstCoords.value = coords
                    props.simulation.addMarker(coords);

                    currentTab.value++;
                    // TODO: Dit is cursed, fix it.
                    tabInfoUpdate(currentTab.value)
                } else if (currentTab.value === tabForSecondCoords) {
                    if (secondCoords.value) {
                        props.simulation.removeMarker(secondCoords.value)
                    }
                    secondCoords.value = coords
                    props.simulation.addMarker(coords)
                    currentTab.value++;
                    
                    // TODO: Dit is cursed, fix it.
                    tabInfoUpdate(currentTab.value)
                }
            }
        })

        function makeGraph() {
            // TODO: Auto update graph when new satellites are added.
            const satellites = props.simulation.getSatellites()
            graph.makeGraph(satellites)

            graph.adjList.forEach((values) => {
                const satLink = new SatLinks(values.sat)
                satLink.setSatelliteConnections(values.connections)

                all.addSatLink(satLink)
            })
        }

        function findPath() {
            if (!firstCoords.value || !secondCoords.value) {
                console.error("No coords selected")
                return
            }

            const sat1 = graph.findClosestSat({
                alt: firstCoords.value.altitude,
                lat: firstCoords.value.lat,
                lng: firstCoords.value.lng
            })
            const sat2 = graph.findClosestSat({
                alt: secondCoords.value.altitude,
                lat: secondCoords.value.lat,
                lng: secondCoords.value.lng
            })
            if (!sat1 || !sat2) {
                return
            }
            const path = graph.findPath(sat1, sat2)

            console.log("Found path: ", path)
            const satList = []
            if (path) {
                for (const node of path) {
                    satList.push(node.sat)
                }
            }

            all.setPath([
                {
                    xyzPosition: polar2Cartesian(
                        secondCoords.value.lat,
                        secondCoords.value.lng,
                        secondCoords.value.altitude,
                        props.simulation.globe.getGlobeRadius()
                    )
                },
                ...satList,
                {
                    xyzPosition: polar2Cartesian(
                        firstCoords.value.lat,
                        firstCoords.value.lng,
                        firstCoords.value.altitude,
                        props.simulation.globe.getGlobeRadius()
                    )
                }
            ])

            // props.simulation.setCurrentlySelected(satList[1])
        }
</script>

<template>
    <LeftInfoBlock :open="true">
        <MultipleTabs :amount='5' @navigate="tabInfoUpdate" v-model="currentTab">

            <template #tab1>
                <h1>{{ t("This is a communication network in space") }}</h1>
                <p>{{ t("Click next to see the connections between them ") }}</p>

            </template>

            <template #tab2>
                <h1> {{ t("Satellits are connected in this way") }}</h1>
            </template>

            <template #tab3>

                <h1>{{ t('Click on the first point you would like to communicate from') }}</h1>
                <p v-if="firstCoords">{{ t('First point') }}: {{ firstCoords.lat }}, {{ firstCoords.lng }}</p>
                <p v-if="firstCoords"> {{ t("Click next to select your destination") }} </p>
            </template>

            <template #tab4>
                <h1>{{ t('And click where you would like to send your message to') }}</h1>
                <p v-if="secondCoords">{{ t('Second point') }}: {{ secondCoords.lat }}, {{ secondCoords.lng }}</p>
                <p v-if="secondCoords"> {{ t("Click next to see the shortest path between the two points") }} </p>
            </template>

            <template #tab5>
                <h1>{{ t("Your message took this route!") }}</h1>
                <p>{{ t("The message had ... hops") }}</p>
                <p>{{ t("And your messgae flew ... kilometers") }}</p>
            </template>
        </MultipleTabs>
    </LeftInfoBlock>

    <!-- <SpeedButtons :simulation="simulation"></SpeedButtons> -->
</template>

<style scoped
       lang="scss">
    .container {
        padding: 10px;

        h1 {
            font-size: 2em;
            margin-bottom: 10px;
        }

        p {
            font-size: 1.2em;
            margin-bottom: 10px;
        }
    }
</style>

<i18n>
  {
    "en": {
      "Longitude": "Longitude",
      "Latitude": "Latitude",
      "First point": "First point",
      "Second point": "Second point",
      "Communication": "Communication",
      "Click on the globe to select two points and find the shortest path between two satellites": "Click on the globe to select two points and find the shortest path between two satellites",
      "Reset route": "Reset route",
      "Amount of hops": "Amount of hops",
      "Distance": "Distance",

    },
    "nl": {
      "Longitude": "Lengtegraad",
      "Latitude": "Breedtegraad",
      "First point": "Eerste punt",
      "Second point": "Tweede punt",
      "Communication": "Communicatie",
      "Click on the globe to select two points and find the shortest path between two satellites": "Klik op de aardbol om twee punten te selecteren en het kortste pad tussen twee satellieten te vinden",
      "Reset route": "Reset route",
      "Amount of hops": "Aantal hops",
      "Distance": "Afstand",
    }
  }

</i18n>
