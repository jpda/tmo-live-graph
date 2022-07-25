import React, { useState, useEffect, useRef } from 'react';
import {  Area, ComposedChart, Line, CartesianGrid, ReferenceLine, XAxis, YAxis, Tooltip } from 'recharts';
import Card from './components/card';
import './App.css';
import tlogo from './img/t.png';

// https://stackoverflow.com/a/62798382
function useInterval(callback, delay) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

function App() {
  const [model, setModel] = useState(process.env.REACT_APP_GATEWAY_MODEL || '');
  const [data, setData] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [login, setLogin] = useState({username: process.env.REACT_APP_USER || 'admin', password: process.env.REACT_APP_PASSWORD || '', error: ''});
  const [loggedIn, setLoggedIn] = useState(false);
  const [cellData, setCellData] = useState({});
  // Automatically login if saved in env
  useEffect(() => {
    if ( login.username && login.password) {
      doLogin();
    }
  });

  const renderComposedChart = (
    <ComposedChart id="composed-chart" width={Math.min(1000, window.innerWidth)} height={Math.min(500, Math.floor(window.innerHeight * 0.4))} data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
      <CartesianGrid stroke="#ccc" strokeDasharray=" 5 5" />
      <Area yAxisId="left"  type="monotone" dataKey="lte.SNRCurrent" stroke="red" fillOpacity={0.5} fill="red" />

      <Line yAxisId="right" type="monotone" dataKey="lte.RSRPCurrent" stroke="crimson" />

      <Area yAxisId="left"  type="monotone" dataKey="nr.SNRCurrent" stroke="blue"  fillOpacity={0.5} fill="blue" />

      <Line yAxisId="right" type="monotone" dataKey="nr.RSRPCurrent" stroke="aqua" />

      <XAxis dataKey="time" />
      <YAxis yAxisId="left" label="SNR" unit="dB" domain={[-5, 40]} tickCount={10} />
      <YAxis yAxisId="right" label="RSRP" unit="dBm" domain={[-140, -44]} tickCount={10} orientation='right' />

      <ReferenceLine yAxisId="left" y={data.length ? data.map(plot => plot.lte.SNRCurrent).reduce((max, val) => val > max ? val : max, -5) : ''} label="Max LTE SNR" stroke="red" strokeDasharray="3 3" isFront />
      <ReferenceLine yAxisId="left" y={data.length ? data.map(plot => plot.lte.SNRCurrent).reduce((min, val) => val < min ? val : min, 40) : ''} label="Min LTE SNR" stroke="red" strokeDasharray="3 3" isFront />
      <ReferenceLine yAxisId="right" y={data.length ? data.map(plot => plot.lte.RSRPCurrent).reduce((max, val) => val > max ? val : max, -140) : ''} label="Max LTE RSRP" stroke="crimson" strokeDasharray="3 3" isFront />
      <ReferenceLine yAxisId="right" y={data.length ? data.map(plot => plot.lte.RSRPCurrent).reduce((min, val) => val < min ? val : min, -44) : ''} label="Min LTE RSRP" stroke="crimson" strokeDasharray="3 3" isFront />
      <ReferenceLine yAxisId="left" y={data.length ? data.map(plot => plot.nr.SNRCurrent).reduce((max, val) => val > max ? val : max, -5) : ''} label="Max NR SNR" stroke="blue" strokeDasharray="3 3" isFront />
      <ReferenceLine yAxisId="left" y={data.length ? data.map(plot => plot.nr.SNRCurrent).reduce((min, val) => val < min ? val : min, 40) : ''} label="Min NR SNR" stroke="blue" strokeDasharray="3 3" isFront />
      <ReferenceLine yAxisId="right" y={data.length ? data.map(plot => plot.nr.RSRPCurrent).reduce((max, val) => val > max ? val : max, -140) : ''} label="Max NR RSRP" stroke="aqua" strokeDasharray="3 3" isFront />
      <ReferenceLine yAxisId="right" y={data.length ? data.map(plot => plot.nr.RSRPCurrent).reduce((min, val) => val < min ? val : min, -44) : ''} label="Min NR RSRP" stroke="aqua" strokeDasharray="3 3" isFront />
      <Tooltip />
    </ComposedChart>
  );

  const renderRSRQChart = (
    <ComposedChart id="rsrq-chart" width={Math.min(1000, window.innerWidth)} height={Math.min(500, Math.floor(window.innerHeight * 0.4))} data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
      <CartesianGrid stroke="#ccc" strokeDasharray=" 5 5" />
      <Area type="monotone" dataKey="lte.RSRQCurrent" stroke="red" fillOpacity={0.5} fill="red" />

      <Area type="monotone" dataKey="nr.RSRQCurrent" stroke="blue"  fillOpacity={0.5} fill="blue" />

      <XAxis dataKey="time" />
      <YAxis label="RSRQ" unit="dB" domain={[-19.5, -3]} tickCount={9} />

      <ReferenceLine y={data.length ? data.map(plot => plot.lte.RSRQCurrent).reduce((max, val) => val > max ? val : max, -19.5) : ''} label="Max LTE RSRQ" stroke="red" strokeDasharray="3 3" isFront />
      <ReferenceLine y={data.length ? data.map(plot => plot.lte.RSRQCurrent).reduce((min, val) => val < min ? val : min, -3) : ''} label="Min LTE RSRQ" stroke="red" strokeDasharray="3 3" isFront />
      <ReferenceLine y={data.length ? data.map(plot => plot.nr.RSRQCurrent).reduce((max, val) => val > max ? val : max, -19.5) : ''} label="Max NR RSRQ" stroke="blue" strokeDasharray="3 3" isFront />
      <ReferenceLine y={data.length ? data.map(plot => plot.nr.RSRQCurrent).reduce((min, val) => val < min ? val : min, -3) : ''} label="Min NR RSRQ" stroke="blue" strokeDasharray="3 3" isFront />
      <Tooltip />
    </ComposedChart>
  );

  useInterval(async () => {
    if (!model) return;
    //if (model === 'ARCKVD21') {
      const res = await fetch('/TMI/v1/gateway?get=all', {
        headers: {
          'Accept': 'application/json'
        }
      });
      const json = await res.json();
      const date = new Date();
      const primary = {...json.signal['4g']};
      const secondary = {...json.signal['5g']};

      //const devInfo = {...json.device};
      setDeviceInfo(json.device);

      const lte = {
        "PhysicalCellID": primary.cid,
        "RSSICurrent": primary.rssi,
        "SNRCurrent": primary.sinr,
        "RSRPCurrent": primary.rsrp,
        "RSRPStrengthIndexCurrent": primary.bars,
        "RSRQCurrent": primary.rsrq,
        "DownlinkEarfcn": null, // Only available in authenticated telemetry endpoint
        "SignalStrengthLevel":0,
        "Band": primary.bands.length ? primary.bands[0].toUpperCase() : null
      };

      const nr = {
        "PhysicalCellID": secondary.cid,
        "SNRCurrent": secondary.sinr,
        "RSRPCurrent": secondary.rsrp,
        "RSRPStrengthIndexCurrent": secondary.bars,
        "RSRQCurrent": secondary.rsrq,
        "Downlink_NR_ARFCN": null, // Only available in authenticated telemetry endpoint
        "SignalStrengthLevel":0,
        "Band": primary.bands.length ? primary.bands[0] : null
      };

      if (primary['RSRPStrengthIndexCurrent'] === 0) {
        primary['SNRCurrent'] = null;
        primary['RSRPCurrent'] = null;
        primary['RSRQCurrent'] = null;
      }
      if (secondary['RSRPStrengthIndexCurrent'] === 0) {
        secondary['SNRCurrent'] = null;
        secondary['RSRPCurrent'] = null;
        secondary['RSRQCurrent'] = null;
      }
      setData(data => [...data.slice(-24), {date, time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}` ,
             lte, nr, ca: null, deviceInfo: deviceInfo }]);
  }, 2000);

  const doLogin = async (e=undefined) => {
    if (!model) return;
    if (loggedIn) return;
    if (e) e.target.disabled = true;
      const res = await fetch('/TMI/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: login.username,
          password: login.password
        })
      });
      const json = await res.json();
      if (!json.hasOwnProperty('auth')) {
        setField('error', 'Problem logging in');
      } else {
        setField('error', '');
        setLoggedIn(true);
        getCellInfoArcadyan(json.auth.token);
      }
    if (e) e.target.disabled = false;
  };

  const getCellInfoArcadyan = async (token) => {
    const res = await fetch('/TMI/v1/network/telemetry?get=all', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    const json = await res.json();

    const data = {
      eNBID: Math.floor(parseInt(json.cell['4g'].ecgi.substring(6)) / 256),
      CellId: json.cell['4g'].sector.cid,
      MCC: json.cell['4g'].mcc,
      MNC: json.cell['4g'].mnc
    };

    setCellData({...data, plmn: `${json.cell['4g'].mcc}-${json.cell['4g'].mnc}`, gps: json.cell.gps});
  };

  const setField = (prop, value) => { setLogin({...login, [prop]: value}) };

  const plmn = {
    '310-260': 'T-Mobile USA',
    '311-490': 'Sprint',
    '312-250': 'Sprint Keep Site'
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1><img class="logo" src={tlogo} alt="t"/><span>Signal Status</span></h1>
        <section>
          <h3>Connected to {deviceInfo.manufacturer} {deviceInfo.model} {deviceInfo.hardwareVersion}</h3>
          <h5>Software v{deviceInfo.softwareVersion} {deviceInfo.updateState}</h5>
          <h5>{loggedIn ? "Authenticated to 192.168.12.1" : "login" }</h5>
        </section>
        {model ? <>
          {'plmn' in cellData ?
          <>
          <dl>
            <dt>Connection Type</dt>
            {cellData.AccessTechnology ?
            <dd>{cellData.AccessTechnology}</dd>
            : <dd>Connection Information</dd>}
            <dt>Operator (PLMN/MCC-MNC)</dt>
            <dd>{cellData.plmn} ({cellData.plmn in plmn ? plmn[cellData.plmn] : 'Unknown'})</dd>
            <dt>eNB ID (Cell Site)</dt>
            <dd><a className="ext-link" href={`https://www.cellmapper.net/map?MCC=${cellData.MCC}&MNC=${cellData.MNC}&type=LTE&latitude=${cellData?.gps?.latitude ?? 44.967242999999996}&longitude=${cellData?.gps?.longitude ?? -103.771556}&zoom=${cellData.hasOwnProperty('gps') ? 14 : 5}&showTowers=true&showTowerLabels=true&clusterEnabled=true&tilesEnabled=true&showOrphans=false&showNoFrequencyOnly=false&showFrequencyOnly=false&showBandwidthOnly=false&DateFilterType=Last&showHex=false&showVerifiedOnly=false&showUnverifiedOnly=false&showLTECAOnly=false&showENDCOnly=false&showBand=0&showSectorColours=true&mapType=roadmap`} target="_blank" rel="noindex nofollow noopener noreferrer">{cellData.eNBID}</a></dd>
            <dt>Cell ID (Cell Site)</dt>
            <dd>{cellData.CellId}</dd>
          </dl>
          </>
          : ''}
        <div className="summary">
          <Card
            signal="lte"
            title="4G LTE"
            main={true}
            band={data.length ? data.slice(-1)[0].lte.Band : 'N/A'}
            RSRPCurrent={data.length ? data.slice(-1)[0].lte.RSRPCurrent : null}
            RSRPBest={data.length ? data.map(plot => plot.lte.RSRPCurrent).filter(val => val !== null).reduce((best, val) => val > best ? val : best, -140) : null}
            SNRCurrent={data.length ? data.slice(-1)[0].lte.SNRCurrent : null}
            SNRBest={data.length ? data.map(plot => plot.lte.SNRCurrent).filter(val => val !== null).reduce((best, val) => val > best ? val : best, -19.5) : null}
            CA={data.length ? data.slice(-1)[0].ca /* "ca":{ "X_ALU_COM_DLCarrierAggregationNumberOfEntries":1, "X_ALU_COM_ULCarrierAggregationNumberOfEntries":0 ,"1":{"PhysicalCellID":49, "ScellBand":"B2", "ScellChannel":675 }} }]} */ : null }
          />
          <Card
            signal="nr"
            title="5G NR"
            main={true}
            band={data.length ? data.slice(-1)[0].nr.Band : 'N/A'}
            RSRPCurrent={data.length ? data.slice(-1)[0].nr.RSRPCurrent : null}
            RSRPBest={data.length ? data.map(plot => plot.nr.RSRPCurrent).filter(val => val !== null).reduce((best, val) => val > best ? val : best, -140) : null}
            SNRCurrent={data.length ? data.slice(-1)[0].nr.SNRCurrent : null}
            SNRBest={data.length ? data.map(plot => plot.nr.SNRCurrent).filter(val => val !== null).reduce((best, val) => val > best ? val : best, -19.5) : null}
          />
        </div>
        </> : ''}
      </header>
      { model ? <>
      <main className="App-body">
        {renderComposedChart}
      </main>
      <header className="App-header">
        <div className="summary">
          <Card
            signal="lte"
            title="4G LTE"
            main={false}
            RSRQCurrent={data.length ? data.slice(-1)[0].lte.RSRQCurrent : null}
            RSRQBest={data.length ? data.map(plot => plot.lte.RSRQCurrent).filter(val => val !== null).reduce((best, val) => val > best ? val : best, -19.5) : null}
          />
          <Card
            signal="nr"
            title="5G NR"
            main={false}
            RSRQCurrent={data.length ? data.slice(-1)[0].nr.RSRQCurrent : null}
            RSRQBest={data.length ? data.map(plot => plot.nr.RSRQCurrent).filter(val => val !== null).reduce((best, val) => val > best ? val : best, -19.5) : null}
          />
        </div>
      </header>
      <main className="App-body">
        {renderRSRQChart}
      </main>
      </> : '' }
    </div>
  );
}

export default App;
