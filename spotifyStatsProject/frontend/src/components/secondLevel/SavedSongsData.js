import React from 'react';

import ExplicitPie from '../thirdLevel/chartWrappers/ExplicitPie'
import ArtistAppsDonut from '../thirdLevel/chartWrappers/ArtistAppsDonut'
import FollowedBar from '../thirdLevel/chartWrappers/FollowedBar'
import SongStatsRadar from '../thirdLevel/chartWrappers/SongStatsRadar'
import PopBar from '../thirdLevel/chartWrappers/PopBar';
import CommonGenresDonut from '../thirdLevel/chartWrappers/CommonGenresDonut';



function SavedSongsData(props) {
    const access_token = props["access_token"]

    return (
        <div id="saved_songs_data">
            <h5>React Average stats for all saved</h5>
            <SongStatsRadar access_token={access_token} top_fifty={false}/>
            <br></br>

            <h5>React artist appearences donut for all saved</h5>
            <ArtistAppsDonut access_token={access_token} top_fifty={false}/>
            <br></br>

            <h5> react explicit pie for all saved</h5>
            <ExplicitPie access_token={access_token} top_fifty={false}/>
        </div>
    )
}


export default SavedSongsData