import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export default function ReplayPanel({play, togglePlay}) {

    return (
        <div>
            { play
                ? <PauseIcon className="justify-self-end m-3 cursor-pointer" onClick={togglePlay}></PauseIcon>
                : <PlayArrowIcon className="justify-self-end m-3 cursor-pointer" onClick={togglePlay}></PlayArrowIcon>
            }
            
        </div>
    )
}