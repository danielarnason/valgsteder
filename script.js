let customMinimap = {
    mmWidget: null,
    olMap: null,
    mmReady: mm => {
        this.mmWidget = mm;
        this.olMap = mm.getMapControl().map

        const removeLayers = () => {
            const egneData = this.olMap.getLayers().getArray().filter(lyr => lyr.get('title'))
            if (egneData.length > 0) {
                egneData.forEach(lyr => {
                    this.olMap.removeLayer(lyr)
                    document.getElementById('legende').style.visibility = 'hidden'
                })
            }
        }

        const legendUpdate = (adresse, valgsted) => {
            const adresseEl = document.getElementById('adresse')
            const valgstedEl = document.getElementById('valgsted')
            adresseEl.innerHTML = adresse
            valgstedEl.innerHTML = valgsted
        }

        const createRouteLayer = async (start, finish) => {
            const format = new ol.format.WKT()
            const startWKT = format.writeGeometry(new ol.Feature(new ol.geom.Point(start)).getGeometry())
            const finishWKT = format.writeGeometry(new ol.Feature(new ol.geom.Point(finish)).getGeometry())

            const pageRequest = this.mmWidget.getSession().createPageRequest('afstand-calculate-route')
            pageRequest.call({
                frompoint: startWKT,
                topoint: finishWKT,
                datasource: 'afstand_route_service',
                command: 'calculate-route-point-to-point',
                routeprofile: 'foot',
                srs: '25832',
                sessionid: pageRequest.sessionId
            }, response => {
                const ruteWkt = response.row[0].row[0].shape_wkt
                const format = new ol.format.WKT()
                const ruteFeature = format.readFeature(ruteWkt)
                const ruteLayer = new ol.layer.Vector({
                    title: 'rute',
                    source: new ol.source.Vector({
                        features: [ruteFeature]
                    }),
                    zIndex: 99,
                    style: new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'black',
                            width: 2,
                            lineDash: [5, 5]
                        })
                    })
                })
                this.olMap.addLayer(ruteLayer)
                this.olMap.getView().fit(ruteLayer.getSource().getExtent(), {
                    padding: [100,50,150,200]
                })
                document.getElementById('legende').style.visibility = 'visible'
            })
        }

        const createPointLayer = async (valgtAdresse, valgsted) => {

            const adresseFeature = new ol.Feature(new ol.geom.Point(valgtAdresse))
            adresseFeature.set('type', 'adresse')
            const valgstedFeature = new ol.Feature(new ol.geom.Point(valgsted))
            valgstedFeature.set('type', 'valgsted')

            const styleFunction = (feature, resolution) => {
                const featureType = feature.get('type')
                const style = new ol.style.Style()
                if (featureType == 'valgsted') {
                    const image = new ol.style.Icon({
                        src: 'data:image/svg+xml;utf8,' + escape('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#0404c2" viewBox="0 0 256 256"><path d="M128,24a80,80,0,0,0-80,80c0,72,80,128,80,128s80-56,80-128A80,80,0,0,0,128,24Zm0,112a32,32,0,1,1,32-32A32,32,0,0,1,128,136Z" opacity="0.2"></path><path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path></svg>'),
                        anchor: [0.5, 1]
                    })
                    style.setImage(image)
                } else if (featureType == 'adresse') {
                    const image = new ol.style.Icon({
                        src: 'data:image/svg+xml;utf8,' + escape('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#22661a" viewBox="0 0 256 256"><path d="M128,24a80,80,0,0,0-80,80c0,72,80,128,80,128s80-56,80-128A80,80,0,0,0,128,24Zm0,112a32,32,0,1,1,32-32A32,32,0,0,1,128,136Z" opacity="0.2"></path><path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path></svg>'),
                        anchor: [0.5, 1]
                    })
                    style.setImage(image)
                }
                return style
            }
            
            const adresseLayer = new ol.layer.Vector({
                title: 'adresser',
                source: new ol.source.Vector({
                    features: [adresseFeature, valgstedFeature]
                }),
                zIndex: 99,
                style: styleFunction
            })
            return adresseLayer
        }

        this.mmWidget.addListener('SEARCH_RESULT_SELECTED', async (eventname, data) => {
            this.mmWidget.clearMarkingGeometry()
            removeLayers()

            const valgtAdresse = data.text
            
            const adresseDawaData = await fetch(`https://api.dataforsyningen.dk/adresser?q=${valgtAdresse}&srid=25832`)
                .then(resp => resp.json())
                .then(async dawaData => {
                    const valgtAdresseKoordinater = dawaData[0].adgangsadresse.adgangspunkt.koordinater
                    const afstemningsOmraadeHref = dawaData[0].adgangsadresse.afstemningsområde.href
                    const adresse = dawaData[0].adressebetegnelse.split(',')[0]
                    return {
                        koordinater: valgtAdresseKoordinater,
                        adresseBetegnelse: adresse,
                        afstemningsOmraadeHref: afstemningsOmraadeHref
                    }
                })

            const valgstedomraadeDawaData = await fetch(`${adresseDawaData.afstemningsOmraadeHref}?srid=25832`)
                .then(resp => resp.json())
                .then(data => {
                    const adresse = data.afstemningssted.adgangsadresse.adressebetegnelse
                    const koordinater = data.afstemningssted.adgangsadresse.koordinater
                    const navn = data.afstemningssted.navn
                    return {
                        adresse: adresse,
                        navn: navn,
                        koordinater: koordinater
                    }
                })

            legendUpdate(adresseDawaData.adresseBetegnelse, `${valgstedomraadeDawaData.navn}<br> ${valgstedomraadeDawaData.adresse.split(',')[0]}`)

            const adresseLayer = await createPointLayer(adresseDawaData.koordinater, valgstedomraadeDawaData.koordinater)
            await createRouteLayer(adresseDawaData.koordinater, valgstedomraadeDawaData.koordinater)
            this.olMap.addLayer(adresseLayer)
        })

        this.mmWidget.addListener('SEARCH_RESULT_CLEARED', removeLayers)

        document.querySelector("#minimapbody_innerContentStartExtentControl > button").addEventListener('click', removeLayers)
    }
}

var aMiniMap = new MiniMap.Widget({
    mapDiv: 'minimapbody',
    minimapId: '096b76a3-7a7e-4aac-827f-36c9f0324d26',
    initCallback: customMinimap.mmReady
})