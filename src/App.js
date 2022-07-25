import React, { useState, useEffect } from 'react';
import Card from './components/card';
import './App.css';
import tlogo from './img/t.png';
import useInterval from './components/useInterval';
import Chart, { rsrqChart } from './components/chart';

function App() {
  const [model] = useState(process.env.REACT_APP_GATEWAY_MODEL || '');
  const [data, setData] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [timeInfo, setTimeInfo] = useState({});
  const [clientData, setClientData] = useState({});
  const [login, setLogin] = useState({ username: process.env.REACT_APP_USER || 'admin', password: process.env.REACT_APP_PASSWORD || '', error: '' });
  const [loggedIn, setLoggedIn] = useState(false);
  const [cellData, setCellData] = useState({});
  const [authToken, setAuthToken] = useState('');

  // Automatically login if saved in env
  useEffect(() => {
    if (login.username && login.password) {
      doLogin();
    }
  });

  const thisChart = Chart(data);
  const rsrq = rsrqChart(data);

  useInterval(async () => {
    if (!model) return;
    const res = await fetch('/TMI/v1/gateway?get=all', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    const json = await res.json();
    const date = new Date();
    const primary = { ...json.signal['4g'] };
    const secondary = { ...json.signal['5g'] };

    // setDeviceInfo(json.device);
    // setTimeInfo(json.time);

    const lte = {
      "PhysicalCellID": primary.cid,
      "RSSICurrent": primary.rssi,
      "SNRCurrent": primary.sinr,
      "RSRPCurrent": primary.rsrp,
      "RSRPStrengthIndexCurrent": primary.bars,
      "RSRQCurrent": primary.rsrq,
      "DownlinkEarfcn": null, // Only available in authenticated telemetry endpoint
      "SignalStrengthLevel": 0,
      "Band": primary.bands.length ? primary.bands[0].toUpperCase() : null
    };

    const nr = {
      "PhysicalCellID": secondary.cid,
      "SNRCurrent": secondary.sinr,
      "RSRPCurrent": secondary.rsrp,
      "RSRPStrengthIndexCurrent": secondary.bars,
      "RSRQCurrent": secondary.rsrq,
      "Downlink_NR_ARFCN": null, // Only available in authenticated telemetry endpoint
      "SignalStrengthLevel": 0,
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
    setData(data => [...data.slice(-24), { date, time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`, lte, nr, ca: null, }]);// deviceInfo, timeInfo }]);
  }, 2000);

  const doLogin = async (e = undefined) => {
    if (!model) return;
    if (loggedIn) return;
    if (e) e.target.disabled = true;
    const res = await fetch('/TMI/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
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
      setAuthToken(json.auth.token);
      setField('error', '');
      setLoggedIn(true);
      getCellInfoArcadyan(json.auth.token);
      getClientData(json.auth.token);
      getGatewayData(json.auth.token);
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

    setCellData({ ...data, plmn: `${json.cell['4g'].mcc}-${json.cell['4g'].mnc}`, gps: json.cell.gps, clients: json.clients });
  };

  const getClientData = async (token) => {
    const res = await fetch('/TMI/v1/network/telemetry?get=all', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    const json = await res.json();
    console.log(json);
    setClientData(json);
  }

  // do this once instead of on each load
  const getGatewayData = async (token) => {
    const res = await fetch('/TMI/v1/gateway?get=all', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const json = await res.json();
    setDeviceInfo(json.device);
    setTimeInfo(json.time);
  }

  // see https://replit.com/@mwittig/Format-processuptime-with-milliseconds#index.js
  const formatUptime = (uptime) => {
    const date = new Date(uptime * 1000);
    const days = date.getUTCDate() - 1,
      hours = date.getUTCHours(),
      minutes = date.getUTCMinutes(),
      seconds = date.getUTCSeconds(),
      milliseconds = date.getUTCMilliseconds();
    let segments = [];
    if (days > 0) segments.push(days + ' day' + ((days === 1) ? '' : 's'));
    if (hours > 0) segments.push(hours + ' hour' + ((hours === 1) ? '' : 's'));
    if (minutes > 0) segments.push(minutes + ' minute' + ((minutes === 1) ? '' : 's'));
    if (seconds > 0) segments.push(seconds + ' second' + ((seconds === 1) ? '' : 's'));
    if (milliseconds > 0) segments.push(milliseconds + ' millisecond' + ((seconds === 1) ? '' : 's'));
    const dateString = segments.join(', ');
    return dateString;
  }


  const setField = (prop, value) => { setLogin({ ...login, [prop]: value }) };

  const plmn = {
    '310-260': 'T-Mobile USA',
    '311-490': 'Sprint',
    '312-250': 'Sprint Keep Site'
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1><img className="logo" src={tlogo} alt="t" /><span>Signal Status</span></h1>
        <section>
          <h3>Connected to {deviceInfo.manufacturer} {deviceInfo.model} {deviceInfo.hardwareVersion}</h3>
        </section>
        {model ? <>
          {'plmn' in cellData ?
            <>
              <dl>
                <dt>Uptime</dt>
                <dd>{timeInfo ? formatUptime(timeInfo.upTime) : 'tbd'}</dd>
                <dt>Software</dt>
                <dd>{deviceInfo.softwareVersion} ({deviceInfo.updateState})</dd>
                <dt>Hardware rev</dt>
                <dd>{deviceInfo.hardwareVersion}</dd>
                {cellData.AccessTechnology ? <><dt>Connection Type</dt><dd>{cellData.AccessTechnology}</dd></> : ''}
                <dt>Hardware address</dt>
                <dd>{deviceInfo.macId}</dd>
                <dt>Serial number</dt>
                <dd>{deviceInfo.serial}</dd>
                <dt>Operator (PLMN/MCC-MNC)</dt>
                <dd>{cellData.plmn} ({cellData.plmn in plmn ? plmn[cellData.plmn] : 'Unknown'})</dd>
                <dt>eNB ID (Cell Site)</dt>
                <dd><a className="ext-link" href={`https://www.cellmapper.net/map?MCC=${cellData.MCC}&MNC=${cellData.MNC}&type=LTE&latitude=${cellData?.gps?.latitude ?? 44.967242999999996}&longitude=${cellData?.gps?.longitude ?? -103.771556}&zoom=${cellData.hasOwnProperty('gps') ? 14 : 5}&showTowers=true&showTowerLabels=true&clusterEnabled=true&tilesEnabled=true&showOrphans=false&showNoFrequencyOnly=false&showFrequencyOnly=false&showBandwidthOnly=false&DateFilterType=Last&showHex=false&showVerifiedOnly=false&showUnverifiedOnly=false&showLTECAOnly=false&showENDCOnly=false&showBand=0&showSectorColours=true&mapType=roadmap`} target="_blank" rel="noindex nofollow noopener noreferrer">{cellData.eNBID}</a></dd>
                <dt>Cell ID (Cell Site)</dt>
                <dd>{cellData.CellId}</dd>
                {/* <dt>Clients</dt>
                <dd>{clientData.clients ? `${clientData.clients["2.4ghz"].length} (2.4Ghz) ${clientData.clients["5.0ghz"].length} (5Ghz)` : "tbd"}</dd> */}
                <dt>2.4Ghz Clients</dt>
                <dd>{clientData.clients ? clientData.clients["2.4ghz"].length : "tbd"}</dd>
                <dt>5Ghz Clients</dt>
                <dd>{clientData.clients ? clientData.clients["5.0ghz"].length : "tbd"}</dd>
                <dt>Ethernet Clients</dt>
                <dd>{clientData.clients ? clientData.clients.ethernet.length : "tbd"}</dd>
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
              CA={data.length ? data.slice(-1)[0].ca /* "ca":{ "X_ALU_COM_DLCarrierAggregationNumberOfEntries":1, "X_ALU_COM_ULCarrierAggregationNumberOfEntries":0 ,"1":{"PhysicalCellID":49, "ScellBand":"B2", "ScellChannel":675 }} }]} */ : null}
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
      {model ? <>
        <main className="App-body">
          {/* todo: figure out what's up with these charts */}
          {thisChart}
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
          {rsrq}
        </main>
      </> : ''}
    </div>
  );
}

export default App;
