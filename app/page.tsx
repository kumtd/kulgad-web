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
			setCellSize(Math . max(10, Math . min(newSize, 60))); // 10 ~ 60
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

				// In case of PINSTAT all response
				if ( Array . isArray(data . pins) && data . pins . length === 256 ) {
					setPins(data.pins);
				}

				// In case of ON/OFF response
				else if ( Array . isArray(data . results) && data . results . length > 0 ) {
					console . log("Partial update received:", data);

					setPins((prevPins) => {
						const updated = [...prevPins];
						const newState = data . cmd === "ON" ? 1 : 0;
						data . results . forEach((item: { pin: number; res?: number }) => {
							if ( typeof item . pin === "number" && item . pin >= 0 && item . pin < 256) {
								updated[item . pin] = newState;
							}
						});

						return updated;
					});
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
			{/*----------------------------------------------------------------------------*/}
			{/* Header                                                                     */}
			{/*----------------------------------------------------------------------------*/}
			<header className="w-full flex items-center justify-between px-6 py-3"
				style={{
					borderBottom: '1px solid #ccc',
					marginBottom: '12px',
					position    : 'relative',
				}}
			>

				{/*--------------------------------------------------------*/}
				{/* Left: KCMS                                             */}
				{/*--------------------------------------------------------*/}
				<div
					style={{
						flex          : '0 0 auto',
						display       : 'flex',
						alignItems    : 'center',
						justifyContent: 'flex-start',
					}}
				>
					<img
						src="/kulgad-web/KCMS-OfficialLogo-box150.jpeg"
						alt="KCMS Logo"

						// Logo click and hover effect
						onClick={() => (window.location.href = '/kulgad-web')}
						style={{
							maxHeight : '10vh', // 10% of browser height
							height    : 'auto',
							width     : 'auto',
							objectFit : 'contain',
							cursor    : 'pointer',
							transition: 'transform 0.2s ease, filter 0.2s ease',
						}}
						onMouseEnter={(e) => {
							(e . currentTarget as HTMLImageElement) . style . transform = 'scale(1.05)';
							(e . currentTarget as HTMLImageElement) . style . filter    = 'brightness(1.2)';
						}}
						onMouseLeave={(e) => {
							(e . currentTarget as HTMLImageElement) . style . transform = 'scale(1.0)';
							(e . currentTarget as HTMLImageElement) . style . filter    = 'brightness(1.0)';
						}}
					/>
				</div>

				{/*--------------------------------------------------------*/}
				{/* Center: title                                          */}
				{/*--------------------------------------------------------*/}
				<div
					style={{
						position  : 'absolute',
						left      : '50%',
						transform : 'translateX(-50%)',
						textAlign : 'center',
						fontWeight: 'bold',
						fontSize  : 'clamp(1rem, 2vw, 2rem)', // Depends on window size
						userSelect: 'none',
						whiteSpace: 'nowrap',
					}}
				>
					LGAD Tester
				</div>

				{/*--------------------------------------------------------*/}
				{/* Right: KU                                              */}
				{/*--------------------------------------------------------*/}
				<div
					style={{
						flex          : '0 0 auto',
						display       : 'flex',
						alignItems    : 'center',
						justifyContent: 'flex-end',
					}}
				>
					<img
						src="/kulgad-web/crimson2positive.gif"
						alt="KU Logo"

						// Logo click and hover effect
						onClick={() => (window.location.href = '/kulgad-web')}
						style={{
							maxHeight : '10vh', // 10% of browser height
							height    : 'auto',
							width     : 'auto',
							objectFit : 'contain',
							cursor    : 'pointer',
							transition: 'transform 0.2s ease, filter 0.2s ease',
						}}
						onMouseEnter={(e) => {
							(e . currentTarget as HTMLImageElement) . style . transform = 'scale(1.05)';
							(e . currentTarget as HTMLImageElement) . style . filter    = 'brightness(1.2)';
						}}
						onMouseLeave={(e) => {
							(e . currentTarget as HTMLImageElement) . style . transform = 'scale(1.0)';
							(e . currentTarget as HTMLImageElement) . style . filter    = 'brightness(1.0)';
						}}
					/>
				</div>
			</header>


			{/*----------------------------------------------------------------------------*/}
			{/* Server connection status                                                   */}
			{/*----------------------------------------------------------------------------*/}
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


			{/*----------------------------------------------------------------------------*/}
			{/* Pin grid                                                                   */}
			{/*----------------------------------------------------------------------------*/}
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
			

			{/*----------------------------------------------------------------------------*/}
			{/* Scan status panel                                                          */}
			{/*----------------------------------------------------------------------------*/}
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


			{/*----------------------------------------------------------------------------*/}
			{/* Buttons                                                                    */}
			{/*----------------------------------------------------------------------------*/}
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


			{/*----------------------------------------------------------------------------*/}
			{/* Logs                                                                       */}
			{/*----------------------------------------------------------------------------*/}
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
