import './Card.css';
import React from 'react';

export class CardData {
    constructor(name, type, strength, range, special, img_url){
        this.name = name;
        this.type = type;
        this.strength = strength;
        this.range = range;
        this.special = special;
        this.img_url = img_url;
    }

    //getCurrentStrength(weather, otherCardsInRow)
}

export class CardView extends React.Component {
    render() {
        let type_icon;

        if(this.props.card.type != "creature")
            type_icon = <p>{this.props.card.type}</p>

        return (
            <div className="card">
                <div className="card_img_area">
                    {/* eventually I should fill this href attribute with a img url from my card data, but not today*/}
                    
                    <a className="card_img" href="{}"></a>
                    <div className="card_icon_column">

                        { (this.props.card.type != "creature") ? <p>{this.props.card.type}</p> : <p></p>}
                        { (this.props.card.strength != -1) ? <p>{this.props.card.strength}</p> : <p></p>}
                        { (this.props.card.type != "none") ? <p>{this.props.card.range}</p> : <p></p>}
                        { (this.props.card.type != "special") ? <p>{this.props.card.none}</p> : <p></p>}
                    </div>


                </div>
                <div className="card_txt_area">
                    <p className="card_name"> {this.props.card.name} </p>
                    <p className="card_total"> (number available / in deck) </p>
                </div>
            </div>
        )
    }
}