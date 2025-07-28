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
const CELL_SIZE = 32;
const WS_URL = 'ws://210.119.41.68:3001';



///-----------------------------------------------------------------------------
/// Main component
///-----------------------------------------------------------------------------
export default function Home()
{
	//----------------------------------------------------------
	// Define states
	//----------------------------------------------------------
	const [pins, setPins] = useState(Array(256) . fill(false));
	const [ws  , setWs  ] = useState<WebSocket | null>(null);


	//----------------------------------------------------------
	// Manage websocket connection
	//----------------------------------------------------------
	useEffect(() => {
		//--------------------------------------
		// Define websocket, connect to server, then save it to the state
		//--------------------------------------
		const socket = new WebSocket(WS_URL);
		setWs(socket);

		//--------------------------------------
		// When receiving mesaage from server
		//--------------------------------------
		socket . onmessage = (event) => {
			try {
				//------------------
				// Data to JSON
				//------------------
				const data = JSON . parse(event . data);

				//------------------
				// Update pin state
				//------------------
				if ( Array . isArray(data . pins) && data . pins . length === 256 ) {
					setPins(data . pins);
				}
			}
			catch ( e ) {
				console . error('Invalid JSON from server', e);
			}
		};

		//--------------------------------------
		// Log
		//--------------------------------------
		socket . onclose = () => console . log('WebSocket disconnected');
		socket . onerror = (err) => console . error('WebSocket error', err);

		//--------------------------------------
		// Clean up
		//--------------------------------------
		return () => {
			socket . close();
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
		ws . send(JSON . stringify(msg));
	};


	//----------------------------------------------------------
	// Page rendering
	//----------------------------------------------------------
	return (
		//--------------------------------------
		// Grid division
		//--------------------------------------
		<div
			className="grid gap-1 p-4"
			style={{
				gridTemplateColumns: `repeat(16, ${CELL_SIZE}px)`,
				gridTemplateRows   : `repeat(16, ${CELL_SIZE}px)`,
				display            : 'grid',
			}}
		>
			{pins . map((on, idx) => (
				<div
					key    ={idx}
					onClick={() => handleClick(idx)}
					style  ={{
						width          : CELL_SIZE,
						height         : CELL_SIZE,
						backgroundColor: on ? 'green' : 'lightgray',
						border         : '1px solid #ccc',
						cursor         : 'pointer',
					}}
				/>
			))}
		</div>
	);
}
