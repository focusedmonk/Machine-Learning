import numpy as np
import random
from itertools import groupby
from itertools import product

class TicTacToe():
    def __init__(self):
        """initialise the board"""
        self.initialize_board()


    def initialize_board(self):
        # initialise state as an array
        self.state = [np.nan for _ in range(9)]  # initialises the board position, can initialise to an array or matrix
        # all possible numbers
        self.all_possible_numbers = [i for i in range(1, len(self.state) + 1)] # can initialise to an array or matrix


    def is_winning(self, curr_state):
        """Takes state as an input and returns whether any row, column or diagonal has winning sum
        Example: Input state- [1, 2, 3, 4, nan, nan, nan, nan, nan]
        Output = False"""
        # Compute the sum for all combinations and check if the sum is 15.
        win_tracker = [
            sum(curr_state[0:3]) == 15, # Row 1
            sum(curr_state[3:6]) == 15, # Row 2
            sum(curr_state[6:9]) == 15, # Row 3
            curr_state[0] + curr_state[3] + curr_state[6] == 15, # Col 1
            curr_state[1] + curr_state[4] + curr_state[7] == 15, # Col 2
            curr_state[2] + curr_state[5] + curr_state[8] == 15, # Col 3
            curr_state[0] + curr_state[4] + curr_state[8] == 15, # Diagonal top-left to bottom-right
            curr_state[2] + curr_state[4] + curr_state[6] == 15 # Diagonal top-right to bottom-left
        ]
        # If the sum is 15 for any of the above combinations, return True else return False.
        for win_flag in win_tracker:
            if win_flag:
                return True
        return False
 

    def is_terminal(self, curr_state):
        # Terminal state could be winning state or when the board is filled up
        if self.is_winning(curr_state) == True:
            return True, 'Win'
        elif len(self.allowed_positions(curr_state)) == 0:
            return True, 'Tie'
        else:
            return False, 'Resume'


    def allowed_positions(self, curr_state):
        """Takes state as an input and returns all indexes that are blank"""
        return [i for i, val in enumerate(curr_state) if np.isnan(val)]


    def allowed_values(self, curr_state):
        """Takes the current state as input and returns all possible (unused) values that can be placed on the board"""
        used_values = [val for val in curr_state if not np.isnan(val)]
        agent_values = [val for val in self.all_possible_numbers if val not in used_values and val % 2 !=0]
        env_values = [val for val in self.all_possible_numbers if val not in used_values and val % 2 ==0]
        return (agent_values, env_values)


    def action_space(self, curr_state):
        """Takes the current state as input and returns all possible actions, i.e, all combinations of allowed positions and allowed values"""
        agent_actions = product(self.allowed_positions(curr_state), self.allowed_values(curr_state)[0])
        env_actions = product(self.allowed_positions(curr_state), self.allowed_values(curr_state)[1])
        return (agent_actions, env_actions)


    def state_transition(self, curr_state, curr_action):
        """Takes current state and action and returns the board position just after agent's move.
        Example: Input state- [1, 2, 3, 4, nan, nan, nan, nan, nan], action- [7, 9] or [position, value]
        Output = [1, 2, 3, 4, nan, nan, nan, 9, nan]
        """
        # Duplicate the state list to update values for new state
        new_state = list(curr_state)
        new_state[curr_action[0]] = curr_action[1]
        return new_state


    def step(self, curr_state, curr_action):
        """Takes current state and action and returns the next state, reward and whether the state is terminal.
        Hint: First, check the board position after agent's move, whether the game is won/loss/tied. Then incorporate environment's move and again check the board status.
        Example: Input state- [1, 2, 3, 4, nan, nan, nan, nan, nan], action- [7, 9] or [position, value]
        Output = ([1, 2, 3, 4, nan, nan, nan, 9, nan], -1, False)"""
        next_state = self.state_transition(curr_state, curr_action)
        terminal_flag, status = self.is_terminal(next_state)
        if status == 'Win': # Agent wins
            reward = 10 # Positive reward for an agent
        elif status == 'Tie':
            reward = 0
        elif status == 'Resume':
            # It's the environment's turn to play the game. Get all the allowed actions and choose a random action for an environment.
            allowed_actions = [action for action in self.action_space(next_state)[1]]
            env_action = allowed_actions[np.random.randint(0, len(allowed_actions))]
            next_state = self.state_transition(next_state, env_action)
            terminal_flag, status = self.is_terminal(next_state)
            if status == 'Win': # Environment wins
                reward = -10 # Negative reward for an agent
            elif status == 'Tie':
                reward = 0
            else:
                reward = -1 # Nobody wins, continue the game
        return next_state, reward, terminal_flag


    def reset(self):
        # Reset the board
        self.initialize_board()
