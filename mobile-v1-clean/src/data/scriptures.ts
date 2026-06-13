export interface Scripture {
    verse: string;
    reference: string;
    steward_note: string;
}

export const SCRIPTURES: Scripture[] = [
    {
        verse: "Commit your work to the Lord, and your plans will be established.",
        reference: "Proverbs 16:3",
        steward_note: "Your follow-ups can be ordered, calm, and intentional."
    },
    {
        verse: "Let the favor of the Lord our God be upon us, and establish the work of our hands.",
        reference: "Psalm 90:17",
        steward_note: "We do not build alone. The foundation rests on His grace."
    },
    {
        verse: "In all toil there is profit, but mere talk tends only to poverty.",
        reference: "Proverbs 14:23",
        steward_note: "Execute the plan. The real business is in the doing."
    },
    {
        verse: "Whatever you do, work heartily, as for the Lord and not for men.",
        reference: "Colossians 3:23",
        steward_note: "The quality of your work is an offering. Leave no detail unfinished."
    },
    {
        verse: "Do you see a man skillful in his work? He will stand before kings.",
        reference: "Proverbs 22:29",
        steward_note: "Excellence creates its own visibility."
    },
    {
        verse: "The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty.",
        reference: "Proverbs 21:5",
        steward_note: "Patience and systems over rushing and chaos."
    },
    {
        verse: "Prepare your work outside; get everything ready for yourself in the field, and after that build your house.",
        reference: "Proverbs 24:27",
        steward_note: "Order matters. Verify the loop before adding complexity."
    }
];

export function getDailyScripture(): Scripture {
    const today = new Date();
    // Get day of year
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = (today.getTime() - start.getTime()) + ((start.getTimezoneOffset() - today.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const index = dayOfYear % SCRIPTURES.length;
    return SCRIPTURES[index];
}
