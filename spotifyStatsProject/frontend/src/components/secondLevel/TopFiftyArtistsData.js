import React from 'react'
import FollowedBar from '../thirdLevel/chartWrappers/FollowedBar'
import PopBar from '../thirdLevel/chartWrappers/PopBar';
import CommonGenresDonut from '../thirdLevel/chartWrappers/CommonGenresDonut';

function TopFiftyArtistsData(props) {
    const access_token = props["access_token"]

    return (
        <div id="top_fifty_artists_data">
            <h5>Most Frequent Genres</h5>
            <CommonGenresDonut access_token={access_token}/>
            <br></br>

            <h5>Global Popularities</h5>
            <PopBar access_token={access_token} artists_bool={true}/>
            <br></br>

            <h5>Top 10 Most Followed</h5>
            <FollowedBar access_token={access_token} top_ten={true}/>
            <h5>Top 10 Least Followed</h5>
            <FollowedBar access_token={access_token} top_ten={false}/>

        </div>
    )

}


export default TopFiftyArtistsData