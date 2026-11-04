import { stepRecipe } from './stepRecipe';
// The step changes only the CSS, so it reuses the metadata step's component. That component loads
// the metadata step's CSS; this step's CSS, a copy with the grouping rules added, loads after it.
import { CustomMessageUi } from './steps/metadata/CustomMessageUi';
import './steps/grouped-metadata/CustomMessageUi.css';

export default stepRecipe(CustomMessageUi);
