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

	pbPlayerInstances.unpush(pbPlayer);
}