/**
 *
 */
function registerPlayerInstance( pbPlayer ) {

	pbPlayerInstances.push(pbPlayer);
}

/**
 *
 */
function unregisterPlayerInstance( pbPlayer ) {

	var i = pbPlayerInstances.length;

	while( i-- ) {

		if( pbPlayerInstances[i] === pbPlayer ) {

			pbPlayerInstances.splice(i, 1);
			return;
		}
	}
}