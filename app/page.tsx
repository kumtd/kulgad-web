////////////////////////////////////////////////////////////////////////////////
///
/// page.tsx of kulgad-web
///
///   Authors: Hoyong Jeong (hoyong5419@korea.ac.kr)
///            Kyungmin Lee (  railroad@korea.ac.kr)
///            Changi Jeong (  jchg3876@korea.ac.kr)
///
////////////////////////////////////////////////////////////////////////////////



'use client';



///-----------------------------------------------------------------------------
/// Import functions
///-----------------------------------------------------------------------------
import React, { useEffect, useState } from 'react';



///-----------------------------------------------------------------------------
/// Constants
///-----------------------------------------------------------------------------
const WS_URL = 'ws://210.119.41.68/ws';



///-----------------------------------------------------------------------------
/// Main component
///-----------------------------------------------------------------------------
export default function Home()
{
	//----------------------------------------------------------
	// Define states
	//----------------------------------------------------------
	const [pins    , setPins    ] = useState(Array(256) . fill(false));
	const [ws      , setWs      ] = useState<WebSocket | null>(null);
	const [scan    , setScan    ] = useState(0);
	const [wsStat  , setWsStat  ] = useState<'disconnected'|'connecting'|'connected'|'error'>('connecting');
	const [logs    , setLogs    ] = useState<string[]>([]);
	const [cellSize, setCellSize] = useState(32);


	//----------------------------------------------------------
	// Calculate dynamic cellSize
	//----------------------------------------------------------
	useEffect(() => {
		const updateSize = () => {
			const w = window . innerWidth;
			const newSize = Math . floor((w - 100) / 16);
			setCellSize(Math . max(20, Math . min(newSize, 60))); // 20 ~ 60
		};
		updateSize();
		window . addEventListener('resize', updateSize);
		return () => window . removeEventListener('resize', updateSize);
	}, []);


	//----------------------------------------------------------
	// Manage websocket connection
	//----------------------------------------------------------
	const connectWebSocket = () => {
		console . log('Connecting to WebSocket server:', WS_URL);
		setWsStat('connecting');

		// If the connection already exists
		if ( ws ) {
			console . log('Closing previous WebSocket connection');
			ws. close();
		}

		const socket = new WebSocket(WS_URL);
		setWs(socket);

		socket . onopen = () => {
			console . log('✅ WebSocket connected');
			setWsStat('connected');
		};

		socket . onmessage = (event) => {
			setLogs(prev => [...prev, event . data]);
			try {
				const data = JSON . parse(event . data);
				if ( Array . isArray(data . pins) && data . pins . length === 256 ) {
					setPins(data.pins);
				}
				if ( typeof data . scan === 'number' ) {
					setScan(data . scan);
				}
			}
			catch (e) {
				console . error('Invalid JSON from server', e);
			}
		};

		socket . onclose = () => {
			console . log('❌ WebSocket disconnected');
			setWsStat('disconnected');
			setLogs(prev => [...prev, '[Disconnected]']);

		};

		socket . onerror = (err) => {
			console . error('⚠️ WebSocket error', err);
			setWsStat('error');
			setLogs(prev => [...prev, '[Error]']);
		};
	};


	useEffect(() => {
		//--------------------------------------
		// Connect to server
		//--------------------------------------
		connectWebSocket();

		//--------------------------------------
		// Clean up
		//--------------------------------------
		return () => {
			if ( ws ) ws . close();
		};
	}, []);


	//----------------------------------------------------------
	// When clicking a cell 
	//----------------------------------------------------------
	const handleClick = (index: number) => {
		//--------------------------------------
		// Do nothing if not connected
		//--------------------------------------
		if ( ! ws || ws . readyState !== WebSocket . OPEN ) return;

		//--------------------------------------
		// Get current pin stat
		//--------------------------------------
		const current = pins[index];

		//--------------------------------------
		// Build message to be sent to websocket server
		//--------------------------------------
		const msg = {
			cmd: 'set',
			ch : index,
			val: !current,
		};

		//--------------------------------------
		// Send
		//--------------------------------------
		console . log('Sending to server: ', msg);
		ws . send(JSON . stringify(msg));
	};


	//----------------------------------------------------------
	// When clicking "Scan"
	//----------------------------------------------------------
	const handleScanClick = () => {
		if ( !ws || ws . readyState !== WebSocket . OPEN ) return;
		ws . send(JSON . stringify({ cmd: 'scan' }));
	};


	//----------------------------------------------------------
	// When clicking "Full Scan"
	//----------------------------------------------------------
	const handleFullScanClick = () => {
		if ( !ws || ws . readyState !== WebSocket . OPEN ) return;
		ws . send(JSON . stringify({ cmd: 'fullscan' }));
	};


	//----------------------------------------------------------
	// WebSocket connection stat indicator
	//----------------------------------------------------------
	const wsColor = wsStat === 'connected'
		? 'green'
		: wsStat === 'connecting'
		? 'orange'
		: wsStat === 'error'
		? 'red'
		: 'gray';


	//----------------------------------------------------------
	// Page rendering
	//----------------------------------------------------------
	return (
		<div className="p-4 space-y-4">
			{/* Server connection status */}
			<div className="flex items-center space-x-2">
				<div
					style={{
						width          : 20,
						height         : 20,
						borderRadius   : '50%',
						backgroundColor: wsColor,
						order          : '1px solid #ccc',
					}}
				/>
				<span>WebSocket: {wsStat}</span>

				{(wsStat === 'disconnected' || wsStat === 'error') && (
					<button
						onClick={connectWebSocket}
						className="px-3 py-1 bg-yellow-400 text-black rounded hover:bg-yellow-500"
					>
						Reconnect
					</button>
				)}
			</div>

			{/* Pin grid */}
			<div
				className="grid gap-1 p-4"
				style={{
					gridTemplateColumns: `repeat(16, ${cellSize}px)`,
					gridTemplateRows   : `repeat(16, ${cellSize}px)`,
					display            : 'grid',
				}}
			>
				{pins . map((on, idx) => (
					<div
						key    ={idx}
						onClick={() => handleClick(idx)}
						style  ={{
							width          : cellSize,
							height         : cellSize,
							backgroundColor: on ? 'green' : 'lightgray',
							border         : '1px solid #ccc',
							cursor         : 'pointer',
							fontSize       : cellSize / 4,
							color          : on ? 'white' : 'black',
							display        : 'flex',
							alignItems     : 'center',
							justifyContent : 'center',
							userSelect     : 'none',
						}}
					>
						{idx}
					</div>
				))}
			</div>
			
			{/* Scan status panel */}
			<div className="flex items-center space-x-2">
				<div
					style={{
					width          : 8*cellSize,
					height         : cellSize,
					backgroundColor: scan === 1 ? 'red' : 'lightgray',
					border         : '1px solid #ccc',
					}}
				/>
				<span>
					{scan === 1 ? 'Scan Running' : 'Idle'}
				</span>
			</div>

			{/* Buttons */}
			<div className="flex space-x-2">
				<button
					onClick={handleScanClick}
					className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
				>
					Scan
				</button>
				<button
					onClick={handleFullScanClick}
					className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
				>
					Full Scan
				</button>
			</div>

			{/* Logs */}
			<div className="bg-black text-green-400 p-2 rounded"
				style={{ height: 200, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12 }}
			>
				{logs . map((line, i) => (
					<div key={i}>{line}</div>
				))}
			</div>
		</div>
	);
}
