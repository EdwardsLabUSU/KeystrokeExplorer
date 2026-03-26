export default function LeftHeader({subjectList, subject, onSubjectChange, assignmentList, assignment, onAssignmentChange, taskList, task, onTaskChange, playback, onPlaybackChange, handleFileChange, maxPlayback}) {
    
    const optionlist = ['','test1','test2']
    return (
        <div className="flex flex-row mb-6 place-content-start">
            <div className="flex flex-col max-w-96 mr-6">
                <label className="inline-block mb-2 text-md font-medium text-gray-900 text-left" htmlFor='file-selector'>
                    Keystroke Upload:
                </label>
                <input id="file-selector" type="file" accept=".csv, .ps2, .log" onChange={handleFileChange}
                className="block text-sm text-gray-400 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-2 file:py-2 file:px-2 file:border-0 file:text-sm file:font-semibold"/>
            
                <div className="mt-6">
                    <Slider
                        value={playback}
                        onValueChange={onPlaybackChange}
                        maxLength={maxPlayback -1}
                    />
                </div>

                {/* <div class="mt-4 relative z-0">
                <input value.bind="searchString & debounce:850" type="text" id="findString"
                    class="block py-2.5 px-0 w-full text-sm ${stringNotFoundClass} text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer"
                    placeholder="" />
                <label for="findString"
                    class="absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                    <p if.bind="stringNotFound"> String Not Found </p>
                    <p else> Search String </p>
                </label>
                </div> */}
            </div>
            <div className="relative space-y-4 w-64">
                <Dropdown
                    options={subjectList}
                    onChange={onSubjectChange}
                    label={'Subject'}
                    chosen={subject}
                />
                <Dropdown
                    options={assignmentList}
                    onChange={onAssignmentChange}
                    label={'Assignment'}
                    chosen={assignment}
                />
                <Dropdown
                    options={taskList}
                    onChange={onTaskChange}
                    label={'File'}
                    chosen={task}
                />
            </div>
        </div>
    )
}

function Dropdown({options, chosen, onChange, label}) {
    return (
        <div className="flex flex-row place-content-between">
            <label htmlFor={label} className="inline-block mb-2 text-md font-medium text-gray-900"> {label}: </label>
            <select
                className="self-end inline-block bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-40 p-1"
                onChange={e => onChange(e.target.value)}
                value={chosen}
            >
                <OptionList
                    options={options}
                />
            </select>
        </div>
    )
}

function OptionList({options}) {
    return (
        <>
            {Array.isArray(options) ? options.map(option =>
                <option key={option}>{option}</option>    

            ) : ''}
        </>
    )
}

function Slider({value, onValueChange, maxLength}) {

    return (
        <div className="text-left">
            <label htmlFor="slider" className="w-full block"> Playback: ({value} / {maxLength}) </label>
            <input value={value} type="range" id="slider" name="slider" 
                min="0" max={maxLength} onKeyDown={event.preventDefault()} onChange={e => onValueChange(Number(e.target.value))}/>
        </div>
    )
}