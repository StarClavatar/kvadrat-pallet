import './EntryPage.css'

const EntryPage = () => {
  return (
    <div className='entry-page'>
      <input className="pin-code" placeholder='Введите пин код'></input>
      <div className="numpad">
          <button className="numpad__button">1</button>
          <button className="numpad__button">2</button>
          <button className="numpad__button">3</button>
          <button className="numpad__button">4</button>
          <button className="numpad__button">5</button>
          <button className="numpad__button">6</button>
          <button className="numpad__button">7</button>
          <button className="numpad__button">8</button>
          <button className="numpad__button">9</button>
          <button className="numpad__button">0</button>
        </div>
    </div>
  )
}

export default EntryPage