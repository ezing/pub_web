/**
 * Created by bai on 2015/9/11.
 */

BLL.www = {
    area: function () {
        return Area.find({}, { sort: { code: 1 }, fields: { _id: 0, weatherID: 0 } }).fetch()
    },
    airQualityForcast: function () {
        return {
            title: '内蒙古自治区污染预报',
            content: (function () {
                var data = DataAirForecast.findOne({}, { sort: { publishtime: -1 } })
                return data ? data.publishcontent || '' : '';
            })(),
            date:(function(){
                function date(i) {
                    var date = new Date();
                    date.setDate(date.getDate() + i);
                    return moment(date).format('MM月DD日');
                }
                return [date(1),date(2),date(3)]
            })(),
            detail: (function () {
                var data = DataAirQuality.find({ date: { $gt: new Date() } }, { sort: { areaCode: 1,date:1 },fields:{_id:0} }).map(function(e){
                    e.code = Math.floor(e.areaCode/100)*100
                    return e;
                });
                return Area.find({code:{$mod:[100,0],$not:{$mod:[1000,0]}}},{sort:{code:1},fields:{_id:0,weatherID:0}}).map(function(e){
                    return {
                        code:e.code,
                        name:e.name,
                        content:data.filter(function(ee){return ee.code==e.code}).map(function(e){
                            delete e.areaCode;
                            delete e.code;
                            delete e.date;
                            return e;
                        })
                    };
                }).filter(function(e){
                    return e.content.length!=0
                });
            })(),
        }
    },
    cityDetail: function (id) {
        id = parseInt(id)
        var city = Area.findOne({ code: id })
        var pollutant = ['AQI', 'PM2.5', 'PM10', 'O3', 'CO', 'SO2', 'NO2'];
        var day = function (n) {
            var date = new Date();
            date.setDate(date.getDate() + n);
            return moment(date).format('MM月DD日')
        }
        var data = DataCityHourly.findOne({ CityCode: id }, { sort: { TimePoint: -1 } })
        return {
            cityCode: city.code,
            cityName: city.name,
            airQualityRealTime: {
                time: moment(data.TimePoint).format('YYYY-MM-DD HH:mm:ss'),
                aqi: Number(data['AQI']),
                level: data['Quality']
            },
            airQualityForecast: (function () {
                return DataAirQuality.find({ areaCode: { $gt: id, $lt: id + 100 }, date: { $gt: new Date() } }).map(function (e) {
                    return {
                        time: moment(e.date).format('MM月DD日'),
                        airQuality: e.airIndexLevel,
                        primaryPollutant: e.primaryPollutant
                    }
                })
            })(),
            pollutantLimit: (function () {
                var arr = Pollutant.find({
                    $and: [{
                        pollutantCode: {
                            $gte: 90
                        }
                    }, {
                            pollutantCode: {
                                $lte: 105
                            }
                        }]
                }, {
                        sort: {
                            pollutantCode: 1
                        }
                    }).fetch();
                var fun = function (code) {
                    return arr.filter(function (e) {
                        return e.pollutantCode == code
                    })[0].limit;
                }
                return {
                    AQI: fun(90),
                    'PM2.5': fun(105),
                    PM10: fun(104),
                    O3: fun(102),
                    SO2: fun(100),
                    NO2: fun(101),
                    CO: fun(103)
                }
            })()
            ,
            pollutant24hour: (function (arr) {
                var data = DataCityHourly.find({ CityCode: id }, { sort: { TimePoint: -1 }, limit: 24 })
                var res = {};
                arr.forEach(function (e) {
                    res[e] = data.map(function (ee) {
                        return {
                            time: moment(ee.TimePoint).format('YYYY-MM-DD HH:mm'),
                            value: (function () {
                                if (e == 'PM2.5') return Number(ee['PM2_5']);
                                if (e == 'CO') return Number(ee['CO']) * 1000;
                                else return Number(ee[e]);
                            })()
                        }
                    });
                    res[e].reverse();
                })
                return res;
            })(pollutant),
            pollutant60day: (function (arr) {
                var data = DataCityDaily.find({ CITYCODE: id.toString() }, { sort: { MONITORTIME: -1 }, limit: 60 })
                var res = {};
                arr.forEach(function (e) {
                    res[e] = data.map(function (ee) {
                        return {
                            date: moment(ee.MONITORTIME).format('YYYY-MM-DD'),
                            value: (function () {
                                if (e == 'PM2.5') return ee['PM2_5'];
                                else if (e == 'O3') return ee['O3_1H'];
                                if (e == 'CO') return Number(ee['CO']) * 1000;
                                else return ee[e];
                            })()
                        }
                    })
                    res[e].reverse();
                })
                return res;
            })(pollutant),
            monitorStationList: (function (arr) {
                return Station.find({ $and: [{ UniqueCode: { $gt: id * 1000 } }, { UniqueCode: { $lt: (id + 1) * 1000 } },
                {enableStatus:true},{publishStatus:true}] }, {
                    sort: { UniqueCode: 1 },
                    fields: { UniqueCode: 1, PositionName: 1 }
                }).map(function (e) {
                    var data = DataStationHourly.findOne({ stationCode: e.UniqueCode }, { sort: { monitorTime: -1 } })
                    return {
                        code: e.UniqueCode,
                        name: e.PositionName,
                        AQI: data['AQI'],
                        "PM2.5": data['105'],
                        PM10: data['104'],
                        O3: data['102'],
                        CO: Math.floor(Number(data['103']) * 1000),
                        SO2: data['100'],
                        NO2: data['101']
                    };
                })
            })(pollutant)
        }
    }
}